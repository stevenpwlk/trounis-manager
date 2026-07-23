import type { AttrKey, ConditionsBassin, Consignes, FormationId, Tireur } from "../data/types";
import { FORMATION_WEIGHTS, SLOTS_BY_FORMATION, SOUFFLE_PERIOD_MULT } from "./formations";
import { tacticsEffect, type TacticsEffect } from "./tactics";
import { bassinEffect, type BassinEffect } from "./bassin";
import type { Rng } from "./rng";

export type MilestoneKind = "lead_change" | "equalizer" | "run" | "comeback" | "clutch" | "drought";

export type MatchEvent = {
  period: number;
  kind: "score" | "anchois" | "saisine" | "deflector";
  side: "home" | "away" | null;
  homeDelta: number;
  awayDelta: number;
  milestone?: MilestoneKind;
  tireurId?: string;
};

export type PeriodLine = { period: number; home: number; away: number };

export type MatchResult = {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  periods: PeriodLine[];
  saisines: Array<{ side: "home" | "away"; tireurId: string; period: number }>;
  milestones: MilestoneKind[];
  finalMomentum: number;
};

export type MatchParams = {
  homeRoster: Tireur[];
  awayRoster: Tireur[];
  formation: FormationId;
  homeConsignes: Consignes;
  awayConsignes: Consignes;
  conditions: ConditionsBassin;
  rng: Rng;
};

const PERIODS = 4;

/** Sélectionne les N meilleurs tireurs disponibles pour la formation (IA de base, §21). */
export function pickLineup(roster: Tireur[], formation: FormationId): Tireur[] {
  const n = SLOTS_BY_FORMATION[formation];
  const w = FORMATION_WEIGHTS[formation];
  const available = roster.filter((t) => t.forme > 0);
  const scored = available
    .map((t) => ({
      t,
      score:
        t.attrs.cavite * w.cavite +
        t.attrs.apnee * w.apnee +
        t.attrs.anchois * w.anchois +
        t.attrs.discipline * w.discipline +
        t.attrs.souffle * w.souffle,
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.t);
}

function weightedAvg(lineup: Tireur[], key: AttrKey): number {
  if (lineup.length === 0) return 0;
  return lineup.reduce((sum, t) => sum + t.attrs[key], 0) / lineup.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type TeamContext = {
  side: "home" | "away";
  roster: Tireur[];
  lineup: Tireur[];
  consignes: Consignes;
  tactics: TacticsEffect;
};

function teamOffense(ctx: TeamContext, formation: FormationId, bassin: BassinEffect, period: number): number {
  const w = FORMATION_WEIGHTS[formation];
  const cavite =
    weightedAvg(ctx.lineup, "cavite") * w.cavite * (ctx.tactics.attackMult.cavite ?? 1) * bassin.caviteMult;
  const anchois =
    weightedAvg(ctx.lineup, "anchois") * w.anchois * (ctx.tactics.attackMult.anchois ?? 1) * bassin.anchoisMult;
  const souffle = weightedAvg(ctx.lineup, "souffle");
  const souffleDeviation = (souffle - 10) / 10;
  const souffleBoost = 1 + souffleDeviation * w.souffle * SOUFFLE_PERIOD_MULT[period - 1]! * 0.22;
  return (cavite * 0.65 + anchois * 0.35) * souffleBoost;
}

function teamDefense(ctx: TeamContext, formation: FormationId, bassin: BassinEffect): number {
  const w = FORMATION_WEIGHTS[formation];
  return weightedAvg(ctx.lineup, "apnee") * w.apnee * (ctx.tactics.defenseMult.apnee ?? 1) * bassin.apneeMult;
}

function anchoisBonusChance(ctx: TeamContext, bassin: BassinEffect): number {
  const anchois = weightedAvg(ctx.lineup, "anchois") * bassin.anchoisMult;
  return clamp((anchois - 8) / 40, 0.02, 0.35);
}

function saisineChance(ctx: TeamContext, formation: FormationId, bassin: BassinEffect, isOpponentProvoking: boolean): number {
  const w = FORMATION_WEIGHTS[formation];
  const discipline = weightedAvg(ctx.lineup, "discipline") * bassin.disciplineMult;
  let base = clamp((14 - discipline) / 100, 0, 0.12) * w.discipline;
  base += ctx.tactics.ownSaisineRiskDelta;
  if (isOpponentProvoking) base += 0.06;
  return clamp(base, 0, 0.35);
}

/**
 * Session de match "vivante" : joue une période à la fois, et permet de
 * changer les consignes d'une équipe entre deux périodes (mi-temps libre,
 * temps mort borné en P3/P4 côté appelant — cette classe ne connaît pas la
 * règle du nombre d'utilisations, c'est à l'appelant de la faire respecter,
 * cf. §4bis/§16 : « le temps mort permet de resynchroniser les consignes »).
 * `simulateMatch` (plus bas) est un simple enrobage qui joue les 4 périodes
 * sans intervention — utilisé tel quel par le moteur de saison/coupe IA vs
 * IA (P1), pour ne rien changer à son comportement/déterminisme.
 */
export class MatchSession {
  private readonly formation: FormationId;
  private readonly bassin: BassinEffect;
  private readonly rng: Rng;
  private home: TeamContext;
  private away: TeamContext;

  private momentum = 0;
  private homeScore = 0;
  private awayScore = 0;
  private priorLeader: "home" | "away" | "tied" = "tied";
  private homeSaisined = false;
  private awaySaisined = false;
  private maxAwayLead = 0;
  private maxHomeLead = 0;
  private currentPeriod = 0;

  readonly events: MatchEvent[] = [];
  readonly periods: PeriodLine[] = [];
  readonly saisines: MatchResult["saisines"] = [];
  private readonly milestoneSet = new Set<MilestoneKind>();

  constructor(params: MatchParams) {
    this.formation = params.formation;
    this.rng = params.rng;
    this.bassin = bassinEffect(params.conditions);
    this.home = {
      side: "home",
      roster: params.homeRoster,
      lineup: pickLineup(params.homeRoster, params.formation),
      consignes: params.homeConsignes,
      tactics: tacticsEffect(params.homeConsignes),
    };
    this.away = {
      side: "away",
      roster: params.awayRoster,
      lineup: pickLineup(params.awayRoster, params.formation),
      consignes: params.awayConsignes,
      tactics: tacticsEffect(params.awayConsignes),
    };
  }

  get period(): number {
    return this.currentPeriod;
  }

  isFinished(): boolean {
    return this.currentPeriod >= PERIODS;
  }

  getScore(): { home: number; away: number } {
    return { home: this.homeScore, away: this.awayScore };
  }

  getMomentum(): number {
    return this.momentum;
  }

  /** Change les consignes d'une équipe pour les périodes restantes (mi-temps/temps mort). */
  setConsignes(side: "home" | "away", consignes: Consignes): void {
    const ctx = side === "home" ? this.home : this.away;
    ctx.consignes = consignes;
    ctx.tactics = tacticsEffect(consignes);
  }

  /** Joue la période suivante ; ne fait rien si le match est déjà terminé. */
  playNextPeriod(): void {
    if (this.isFinished()) return;
    const period = this.currentPeriod + 1;
    const { home, away, bassin, formation, rng } = this;

    const homeTargetsWeakApnee =
      home.consignes.ciblage === "cibler-apnee" && weightedAvg(away.lineup, "apnee") < 11 ? 1.1 : 1;
    const awayTargetsWeakApnee =
      away.consignes.ciblage === "cibler-apnee" && weightedAvg(home.lineup, "apnee") < 11 ? 1.1 : 1;

    const homeOffense = teamOffense(home, formation, bassin, period) * homeTargetsWeakApnee;
    const awayOffense = teamOffense(away, formation, bassin, period) * awayTargetsWeakApnee;
    const homeDefense = teamDefense(home, formation, bassin);
    const awayDefense = teamDefense(away, formation, bassin);

    const homeMomentumFactor = 1 + clamp(this.momentum / 100, -0.15, 0.15);
    const awayMomentumFactor = 1 + clamp(-this.momentum / 100, -0.15, 0.15);

    const homeVariance = home.tactics.varianceMult;
    const awayVariance = away.tactics.varianceMult;

    const homeEdge = (homeOffense - awayDefense) * homeMomentumFactor;
    const awayEdge = (awayOffense - homeDefense) * awayMomentumFactor;

    let homePts = clamp(Math.round(14 + homeEdge * 0.45 + rng.noise(4.5 * homeVariance)), 2, 30);
    let awayPts = clamp(Math.round(14 + awayEdge * 0.45 + rng.noise(4.5 * awayVariance)), 2, 30);

    if (rng.chance(bassin.deflectorChance)) {
      const side: "home" | "away" = rng.chance(0.5) ? "home" : "away";
      const reduction = rng.int(1, 3);
      if (side === "home") homePts = clamp(homePts - reduction, 2, 30);
      else awayPts = clamp(awayPts - reduction, 2, 30);
      this.events.push({ period, kind: "deflector", side, homeDelta: 0, awayDelta: 0 });
    }

    if (rng.chance(anchoisBonusChance(home, bassin))) {
      homePts += 1;
      this.events.push({ period, kind: "anchois", side: "home", homeDelta: 1, awayDelta: 0 });
    }
    if (rng.chance(anchoisBonusChance(away, bassin))) {
      awayPts += 1;
      this.events.push({ period, kind: "anchois", side: "away", homeDelta: 0, awayDelta: 1 });
    }

    if (!this.homeSaisined && rng.chance(saisineChance(home, formation, bassin, away.consignes.discipline === "provoquer"))) {
      const target = [...home.lineup].sort((a, b) => a.attrs.discipline - b.attrs.discipline)[0];
      if (target) {
        home.lineup = home.lineup.filter((t) => t.id !== target.id);
        this.homeSaisined = true;
        this.saisines.push({ side: "home", tireurId: target.id, period });
        this.events.push({ period, kind: "saisine", side: "home", homeDelta: 0, awayDelta: 0, tireurId: target.id });
      }
    }
    if (!this.awaySaisined && rng.chance(saisineChance(away, formation, bassin, home.consignes.discipline === "provoquer"))) {
      const target = [...away.lineup].sort((a, b) => a.attrs.discipline - b.attrs.discipline)[0];
      if (target) {
        away.lineup = away.lineup.filter((t) => t.id !== target.id);
        this.awaySaisined = true;
        this.saisines.push({ side: "away", tireurId: target.id, period });
        this.events.push({ period, kind: "saisine", side: "away", homeDelta: 0, awayDelta: 0, tireurId: target.id });
      }
    }

    this.homeScore += homePts;
    this.awayScore += awayPts;
    this.periods.push({ period, home: homePts, away: awayPts });
    this.events.push({ period, kind: "score", side: null, homeDelta: homePts, awayDelta: awayPts });

    const leader: "home" | "away" | "tied" =
      this.homeScore === this.awayScore ? "tied" : this.homeScore > this.awayScore ? "home" : "away";
    if (leader === "tied" && this.priorLeader !== "tied") {
      this.milestoneSet.add("equalizer");
    } else if (leader !== "tied" && this.priorLeader !== "tied" && leader !== this.priorLeader) {
      this.milestoneSet.add("lead_change");
    } else if (leader !== "tied" && this.priorLeader === "tied" && period > 1) {
      this.milestoneSet.add("lead_change");
    }
    this.priorLeader = leader;

    this.maxHomeLead = Math.max(this.maxHomeLead, this.homeScore - this.awayScore);
    this.maxAwayLead = Math.max(this.maxAwayLead, this.awayScore - this.homeScore);

    const periodDiff = homePts - awayPts;
    const shift = clamp(periodDiff * 3, -25, 25);
    this.momentum = clamp(this.momentum + shift, -100, 100);

    this.currentPeriod = period;

    if (this.currentPeriod === PERIODS) {
      this.finalizeMilestones();
    }
  }

  private finalizeMilestones(): void {
    const beforeP4 = this.periods.slice(0, 3).reduce((acc, p) => acc + p.home - p.away, 0);
    if (Math.abs(beforeP4) <= 6) this.milestoneSet.add("clutch");

    if ((this.maxAwayLead >= 10 && this.homeScore > this.awayScore) || (this.maxHomeLead >= 10 && this.awayScore > this.homeScore)) {
      this.milestoneSet.add("comeback");
    }

    const homeWonPeriods = this.periods.filter((p) => p.home > p.away).length;
    const awayWonPeriods = this.periods.filter((p) => p.away > p.home).length;
    if (homeWonPeriods >= 3 || awayWonPeriods >= 3) this.milestoneSet.add("run");
  }

  getResult(): MatchResult {
    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      events: this.events,
      periods: this.periods,
      saisines: this.saisines,
      milestones: Array.from(this.milestoneSet),
      finalMomentum: this.momentum,
    };
  }
}

/** Joue un match complet sans intervention — enrobage de MatchSession, utilisé
 * tel quel par le moteur de saison/coupe IA vs IA (comportement P1 inchangé). */
export function simulateMatch(params: MatchParams): MatchResult {
  const session = new MatchSession(params);
  while (!session.isFinished()) session.playNextPeriod();
  return session.getResult();
}
