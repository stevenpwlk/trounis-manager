import type { Tireur } from "../data/types";
import { L1_CODES, L2_CODES } from "../data/clubs";
import { generateClubRoster } from "../data/roster";
import { createRng, type Rng } from "./rng";
import { generateDoubleRoundRobin, type Fixture } from "./schedule";
import { segmentForJournee, FORMATION_BY_SEASON } from "./formations";
import { randomConditions } from "./bassin";
import { simulateMatch, type MatchResult } from "./match";
import { createStandings, applyResult, sortedStandings, type StandingRow } from "./standings";
import { DEFAULT_CONSIGNES } from "../data/types";

export type PlayedFixture = Fixture & { result: MatchResult };

export type LeagueSeasonResult = {
  league: "L1" | "L2";
  standings: StandingRow[];
  fixtures: PlayedFixture[];
};

export type SeasonResult = {
  l1: LeagueSeasonResult;
  l2: LeagueSeasonResult;
  rosters: Map<string, Tireur[]>;
  barrage: { home: string; away: string; result: MatchResult; winner: string };
};

function simulateLeague(codes: string[], league: "L1" | "L2", rosters: Map<string, Tireur[]>, rng: Rng): LeagueSeasonResult {
  const fixtures = generateDoubleRoundRobin(codes);
  const standings = createStandings(codes);
  const played: PlayedFixture[] = [];

  for (const fixture of fixtures) {
    const segment = segmentForJournee(fixture.journee);
    const formation = FORMATION_BY_SEASON[segment];
    const homeRoster = rosters.get(fixture.home)!;
    const awayRoster = rosters.get(fixture.away)!;
    const conditions = randomConditions(rng);
    const result = simulateMatch({
      homeRoster,
      awayRoster,
      formation,
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions,
      rng,
    });
    applyResult(standings, fixture.home, fixture.away, result);
    played.push({ ...fixture, result });
  }

  return { league, standings: sortedStandings(standings), fixtures: played };
}

/**
 * Simule une saison complète (2 ligues, 18 journées chacune + barrage,
 * §9). La Coupe (inter-ligues, §28) est simulée séparément — cf. cup.ts —
 * pour garder cette fonction focalisée sur le championnat.
 */
export function simulateSeason(seed: number | string): SeasonResult {
  const rng = createRng(seed);
  const rosters = new Map<string, Tireur[]>();
  for (const code of [...L1_CODES, ...L2_CODES]) {
    rosters.set(code, generateClubRoster(code, rng));
  }

  const l1 = simulateLeague(L1_CODES, "L1", rosters, rng);
  const l2 = simulateLeague(L2_CODES, "L2", rosters, rng);

  // Barrage : 3e de L2 vs 8e de L1, match sec, formation hiver (fin de saison, §9/§28)
  const thirdL2 = l2.standings[2]!.code;
  const eighthL1 = l1.standings[7]!.code;
  const barrageResult = simulateMatch({
    homeRoster: rosters.get(eighthL1)!,
    awayRoster: rosters.get(thirdL2)!,
    formation: "carre-cercle",
    homeConsignes: DEFAULT_CONSIGNES,
    awayConsignes: DEFAULT_CONSIGNES,
    conditions: randomConditions(rng),
    rng,
  });
  const barrageWinner = barrageResult.homeScore >= barrageResult.awayScore ? eighthL1 : thirdL2;

  return {
    l1,
    l2,
    rosters,
    barrage: { home: eighthL1, away: thirdL2, result: barrageResult, winner: barrageWinner },
  };
}

/** Applique la promotion/relégation 2+2 + barrage (§9) : retourne les nouveaux codes L1/L2. */
export function applyPromotionRelegation(season: SeasonResult): { l1: string[]; l2: string[] } {
  const l1Stay = season.l1.standings.slice(0, 8).map((r) => r.code); // 1-8, le 8e joue le barrage mais reste sauf défaite
  const l1Relegated = season.l1.standings.slice(8, 10).map((r) => r.code); // 9-10 descendent directement
  const l2Promoted = season.l2.standings.slice(0, 2).map((r) => r.code); // 1-2 montent directement
  const l2Stay = season.l2.standings.slice(3, 10).map((r) => r.code); // 4-10 restent (le 3e dépend du barrage)

  const eighthL1 = season.l1.standings[7]!.code;
  const thirdL2 = season.l2.standings[2]!.code;

  let newL1: string[];
  let newL2: string[];
  if (season.barrage.winner === eighthL1) {
    // le 8e de L1 se maintient, le 3e de L2 reste en L2
    newL1 = [...l1Stay, ...l2Promoted];
    newL2 = [...l1Relegated, thirdL2, ...l2Stay];
  } else {
    // le 3e de L2 monte à la place du 8e de L1
    newL1 = [...l1Stay.filter((c) => c !== eighthL1), thirdL2, ...l2Promoted];
    newL2 = [...l1Relegated, eighthL1, ...l2Stay];
  }
  return { l1: newL1, l2: newL2 };
}
