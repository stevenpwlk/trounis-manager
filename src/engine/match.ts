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

export function simulateMatch(params: MatchParams): MatchResult {
  const { homeRoster, awayRoster, formation, homeConsignes, awayConsignes, conditions, rng } = params;

  const home: TeamContext = {
    side: "home",
    roster: homeRoster,
    lineup: pickLineup(homeRoster, formation),
    consignes: homeConsignes,
    tactics: tacticsEffect(homeConsignes),
  };
  const away: TeamContext = {
    side: "away",
    roster: awayRoster,
    lineup: pickLineup(awayRoster, formation),
    consignes: awayConsignes,
    tactics: tacticsEffect(awayConsignes),
  };

  const bassin = bassinEffect(conditions);

  const events: MatchEvent[] = [];
  const periods: PeriodLine[] = [];
  const saisines: MatchResult["saisines"] = [];
  const milestones: MilestoneKind[] = [];

  let momentum = 0;
  let homeScore = 0;
  let awayScore = 0;
  let priorLeader: "home" | "away" | "tied" = "tied";
  let homeSaisined = false;
  let awaySaisined = false;
  let maxAwayLead = 0;
  let maxHomeLead = 0;

  for (let period = 1; period <= PERIODS; period++) {
    // Ciblage "cibler l'apnée adverse" : bonus si l'apnée adverse est faible (duel direct)
    const homeTargetsWeakApnee =
      home.consignes.ciblage === "cibler-apnee" && weightedAvg(away.lineup, "apnee") < 11 ? 1.1 : 1;
    const awayTargetsWeakApnee =
      away.consignes.ciblage === "cibler-apnee" && weightedAvg(home.lineup, "apnee") < 11 ? 1.1 : 1;

    const homeOffense = teamOffense(home, formation, bassin, period) * homeTargetsWeakApnee;
    const awayOffense = teamOffense(away, formation, bassin, period) * awayTargetsWeakApnee;
    const homeDefense = teamDefense(home, formation, bassin);
    const awayDefense = teamDefense(away, formation, bassin);

    const homeMomentumFactor = 1 + clamp(momentum / 100, -0.15, 0.15);
    const awayMomentumFactor = 1 + clamp(-momentum / 100, -0.15, 0.15);

    const homeVariance = home.tactics.varianceMult;
    const awayVariance = away.tactics.varianceMult;

    const homeEdge = (homeOffense - awayDefense) * homeMomentumFactor;
    const awayEdge = (awayOffense - homeDefense) * awayMomentumFactor;

    let homePts = clamp(Math.round(14 + homeEdge * 0.45 + rng.noise(4.5 * homeVariance)), 2, 30);
    let awayPts = clamp(Math.round(14 + awayEdge * 0.45 + rng.noise(4.5 * awayVariance)), 2, 30);

    // Déflecteur (risque marin) : borné, ne renverse jamais un écart énorme (§14.1-e)
    if (rng.chance(bassin.deflectorChance)) {
      const side: "home" | "away" = rng.chance(0.5) ? "home" : "away";
      const reduction = rng.int(1, 3);
      if (side === "home") homePts = clamp(homePts - reduction, 2, 30);
      else awayPts = clamp(awayPts - reduction, 2, 30);
      events.push({ period, kind: "deflector", side, homeDelta: 0, awayDelta: 0 });
    }

    // Anchois bonus (discret, +1, §16)
    if (rng.chance(anchoisBonusChance(home, bassin))) {
      homePts += 1;
      events.push({ period, kind: "anchois", side: "home", homeDelta: 1, awayDelta: 0 });
    }
    if (rng.chance(anchoisBonusChance(away, bassin))) {
      awayPts += 1;
      events.push({ period, kind: "anchois", side: "away", homeDelta: 0, awayDelta: 1 });
    }

    // Saisines (max 1 par équipe par match, §14.6)
    if (!homeSaisined && rng.chance(saisineChance(home, formation, bassin, away.consignes.discipline === "provoquer"))) {
      const target = [...home.lineup].sort((a, b) => a.attrs.discipline - b.attrs.discipline)[0];
      if (target) {
        home.lineup = home.lineup.filter((t) => t.id !== target.id);
        homeSaisined = true;
        saisines.push({ side: "home", tireurId: target.id, period });
        events.push({ period, kind: "saisine", side: "home", homeDelta: 0, awayDelta: 0, tireurId: target.id });
      }
    }
    if (!awaySaisined && rng.chance(saisineChance(away, formation, bassin, home.consignes.discipline === "provoquer"))) {
      const target = [...away.lineup].sort((a, b) => a.attrs.discipline - b.attrs.discipline)[0];
      if (target) {
        away.lineup = away.lineup.filter((t) => t.id !== target.id);
        awaySaisined = true;
        saisines.push({ side: "away", tireurId: target.id, period });
        events.push({ period, kind: "saisine", side: "away", homeDelta: 0, awayDelta: 0, tireurId: target.id });
      }
    }

    homeScore += homePts;
    awayScore += awayPts;
    periods.push({ period, home: homePts, away: awayPts });
    events.push({ period, kind: "score", side: null, homeDelta: homePts, awayDelta: awayPts });

    // Milestones
    const leader: "home" | "away" | "tied" = homeScore === awayScore ? "tied" : homeScore > awayScore ? "home" : "away";
    if (leader === "tied" && priorLeader !== "tied") {
      milestones.push("equalizer");
    } else if (leader !== "tied" && priorLeader !== "tied" && leader !== priorLeader) {
      milestones.push("lead_change");
    } else if (leader !== "tied" && priorLeader === "tied" && period > 1) {
      milestones.push("lead_change");
    }
    priorLeader = leader;

    maxHomeLead = Math.max(maxHomeLead, homeScore - awayScore);
    maxAwayLead = Math.max(maxAwayLead, awayScore - homeScore);

    // Momentum update
    const periodDiff = homePts - awayPts;
    const shift = clamp(periodDiff * 3, -25, 25);
    momentum = clamp(momentum + shift, -100, 100);
  }

  // Clutch : la période 4 a un écart cumulé serré (<=6) à l'entame de la période
  const beforeP4 = periods.slice(0, 3).reduce((acc, p) => acc + p.home - p.away, 0);
  if (Math.abs(beforeP4) <= 6) milestones.push("clutch");

  // Comeback : une équipe menée d'au moins 10 pts à un moment donné a fini par gagner
  if ((maxAwayLead >= 10 && homeScore > awayScore) || (maxHomeLead >= 10 && awayScore > homeScore)) {
    milestones.push("comeback");
  }

  // Run : une équipe a dominé 3 périodes ou plus sur les 4
  const homeWonPeriods = periods.filter((p) => p.home > p.away).length;
  const awayWonPeriods = periods.filter((p) => p.away > p.home).length;
  if (homeWonPeriods >= 3 || awayWonPeriods >= 3) milestones.push("run");

  return {
    homeScore,
    awayScore,
    events,
    periods,
    saisines,
    milestones: Array.from(new Set(milestones)),
    finalMomentum: momentum,
  };
}
