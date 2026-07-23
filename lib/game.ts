import type { ConditionsBassin, Consignes, FormationId, Tireur } from "../src/data/types";
import { DEFAULT_CONSIGNES } from "../src/data/types";
import { CLUBS, L1_CODES, L2_CODES, getClub } from "../src/data/clubs";
import { generateClubRoster } from "../src/data/roster";
import { createRng } from "../src/engine/rng";
import { generateDoubleRoundRobin, type Fixture } from "../src/engine/schedule";
import { segmentForJournee, FORMATION_BY_SEASON } from "../src/engine/formations";
import { randomConditions } from "../src/engine/bassin";
import { simulateMatch, type MatchResult } from "../src/engine/match";
import { createStandings, applyResult, sortedStandings, type StandingRow } from "../src/engine/standings";
import { evaluateObjective, type ObjectivePalier } from "../src/engine/objective";
import { applyPostMatchFatigue, applyWeeklyRecovery } from "../src/engine/training";

/**
 * Orchestration d'UNE saison jouable en solo (P2, §34) : le joueur dirige un
 * seul club, les 19 autres sont simulés en IA (auto-composition + consignes
 * par défaut, cf. §21). Pas de persistance multi-saison, pas de Vivier/
 * mercato IA (P3) — le mercato du joueur reste possible (agents libres +
 * offres simples, §8) mais les autres clubs ne "vivent" pas leur mercato ici.
 */

export type PendingStep = "training" | "lineup" | "match" | "post-match" | "season-end";

export type SeasonReport = {
  finalRank: number;
  standing: StandingRow;
  objectivePalier: ObjectivePalier;
  wonTitle: boolean;
};

export type GameState = {
  worldName: string;
  seed: string;
  clubCode: string;
  league: "L1" | "L2";
  budget: number;
  journee: number; // 1..18 ; 19 = saison terminée
  rosters: Record<string, Tireur[]>;
  fixtures: Fixture[]; // calendrier complet de la ligue du joueur
  standings: Record<"L1" | "L2", StandingRow[]>; // classement courant (recalculé à chaque journée jouée)
  playedResults: Array<{ journee: number; home: string; away: string; result: MatchResult }>;
  trainingDoneThisJournee: boolean;
  restedTireurId: string | null;
  lastMatchResult: MatchResult | null;
  lastMatchOpponent: string | null;
  seasonReport: SeasonReport | null;
};

function otherLeagueCodes(league: "L1" | "L2"): string[] {
  return league === "L1" ? L1_CODES : L2_CODES;
}

export function createNewGame(worldName: string, clubCode: string, seed: string): GameState {
  const rng = createRng(seed);
  const club = getClub(clubCode);
  const rosters: Record<string, Tireur[]> = {};
  for (const c of CLUBS) rosters[c.code] = generateClubRoster(c.code, rng);

  const leagueCodes = otherLeagueCodes(club.league);
  const fixtures = generateDoubleRoundRobin(leagueCodes);
  const standings = {
    L1: sortedStandings(createStandings(L1_CODES)),
    L2: sortedStandings(createStandings(L2_CODES)),
  };

  return {
    worldName,
    seed,
    clubCode,
    league: club.league,
    budget: club.budget,
    journee: 1,
    rosters,
    fixtures,
    standings,
    playedResults: [],
    trainingDoneThisJournee: false,
    restedTireurId: null,
    lastMatchResult: null,
    lastMatchOpponent: null,
    seasonReport: null,
  };
}

export function currentFixture(state: GameState): Fixture | null {
  if (state.journee > 18) return null;
  return state.fixtures.find((f) => f.journee === state.journee && (f.home === state.clubCode || f.away === state.clubCode)) ?? null;
}

export function currentFormation(state: GameState): FormationId {
  return FORMATION_BY_SEASON[segmentForJournee(state.journee)];
}

export function currentBassin(state: GameState): ConditionsBassin {
  return randomConditions(createRng(`${state.seed}-bassin-${state.journee}`));
}

/**
 * Simule tous les matchs d'une journée SAUF celui du joueur (qui sera joué
 * interactivement via MatchSession dans l'écran de live). Applique la
 * fatigue post-match aux tireurs alignés des clubs IA.
 */
export function simulateAiMatchesForJournee(state: GameState, journee: number): GameState {
  const rng = createRng(`${state.seed}-ai-${journee}`);
  const formation = FORMATION_BY_SEASON[segmentForJournee(journee)];
  const fixturesThisJournee = state.fixtures.filter((f) => f.journee === journee);
  const league = state.league === "L1" ? "L1" : "L2";
  const standingsTable = createStandings(league === "L1" ? L1_CODES : L2_CODES);
  // reconstruit le classement courant à partir des résultats déjà joués (y compris le futur match du joueur, ajouté séparément)
  for (const played of state.playedResults) {
    applyResult(standingsTable, played.home, played.away, played.result);
  }

  const playedResults = [...state.playedResults];
  for (const fixture of fixturesThisJournee) {
    if (fixture.home === state.clubCode || fixture.away === state.clubCode) continue; // joué séparément
    const conditions = randomConditions(rng);
    const result = simulateMatch({
      homeRoster: state.rosters[fixture.home]!,
      awayRoster: state.rosters[fixture.away]!,
      formation,
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions,
      rng,
    });
    applyResult(standingsTable, fixture.home, fixture.away, result);
    playedResults.push({ journee, home: fixture.home, away: fixture.away, result });
  }

  return {
    ...state,
    playedResults,
    standings: { ...state.standings, [league]: sortedStandings(standingsTable) },
  };
}

/** À appeler une fois le match du joueur terminé : enregistre le résultat au classement. */
export function recordPlayerMatch(state: GameState, home: string, away: string, result: MatchResult): GameState {
  const league = state.league;
  const table = createStandings(league === "L1" ? L1_CODES : L2_CODES);
  const playedResults = [...state.playedResults, { journee: state.journee, home, away, result }];
  for (const played of playedResults) {
    if (played.journee <= state.journee) applyResult(table, played.home, played.away, played.result);
  }
  return { ...state, playedResults, standings: { ...state.standings, [league]: sortedStandings(table) } };
}

/** Avance à la journée suivante (ou termine la saison après la 18e). */
export function advanceJournee(state: GameState): GameState {
  const next = state.journee + 1;
  if (next > 18) {
    return finalizeSeason({ ...state, journee: next });
  }
  return { ...state, journee: next, trainingDoneThisJournee: false, restedTireurId: null, lastMatchResult: null, lastMatchOpponent: null };
}

function finalizeSeason(state: GameState): GameState {
  const table = state.standings[state.league];
  const rankIdx = table.findIndex((r) => r.code === state.clubCode);
  const finalRank = rankIdx + 1;
  const club = getClub(state.clubCode);
  const wonTitle = finalRank === 1;
  const palier = evaluateObjective({ finalRank, targetRank: club.targetRank, wonTitle });
  return {
    ...state,
    seasonReport: {
      finalRank,
      standing: table[rankIdx]!,
      objectivePalier: palier,
      wonTitle,
    },
  };
}

/** Applique la fatigue post-match + la récupération hebdomadaire au club du joueur. */
export function applyWeeklyConditioning(roster: Tireur[], playedLineup: Tireur[], restedId: string | null, seed: string): void {
  const rng = createRng(seed);
  applyPostMatchFatigue(playedLineup, rng);
  applyWeeklyRecovery(
    roster.filter((t) => !playedLineup.some((p) => p.id === t.id)),
    restedId
  );
}
