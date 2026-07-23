import type { FormationId, Tireur } from "../data/types";
import { simulateMatch, type MatchResult } from "./match";
import { randomConditions } from "./bassin";
import { DEFAULT_CONSIGNES } from "../data/types";
import type { Rng } from "./rng";
import type { StandingRow } from "./standings";

export type CupTie = { home: string; away: string; result: MatchResult; winner: string };
export type CupRound = { name: string; ties: CupTie[] };

export type CupResult = {
  rounds: CupRound[];
  champion: string;
};

/**
 * Coupe de la F.I.S.T. inter-ligues (§9/§28) : préliminaire à 8 (mal classés
 * de L2) -> 8es -> quarts -> demis -> finale. Tirage aléatoire à chaque tour,
 * sans tête de série, avec une seule règle anti-redite (deux clubs qui
 * viennent de s'affronter en championnat ne retombent pas l'un sur l'autre
 * au tour suivant).
 */
export function simulateCup(
  l1Standings: StandingRow[],
  l2Standings: StandingRow[],
  rosters: Map<string, Tireur[]>,
  recentOpponents: Map<string, Set<string>>,
  rng: Rng,
  /** Formation en vigueur au moment du tour (§9 : "utilise la formation de la
   * saison en cours") — fixe ici car ce rapport joue la Coupe après une
   * saison complète plutôt que de l'entrelacer au calendrier (simplification
   * P1 ; l'entrelacement réel est un souci d'interface, pas du moteur). */
  formation: FormationId = "libre"
): CupResult {
  const l2ByRank = l2Standings.map((r) => r.code);
  const preliminaryClubs = l2ByRank.slice(2, 10); // rangs 3-10 de L2 : les "mal classés" (hors les 2 meilleurs)
  const seededClubs = [...l1Standings.map((r) => r.code), l2ByRank[0]!, l2ByRank[1]!]; // 10 L1 + 2 meilleurs L2

  const rounds: CupRound[] = [];

  const preliminaryTies = drawRound(preliminaryClubs, recentOpponents, rng);
  const preliminaryResult = playRound("Préliminaire", preliminaryTies, rosters, rng, formation);
  rounds.push(preliminaryResult);

  let survivors = [...seededClubs, ...preliminaryResult.ties.map((t) => t.winner)];

  const roundNames = ["8es de finale", "Quarts de finale", "Demi-finales", "Finale"];
  for (const name of roundNames) {
    const ties = drawRound(survivors, recentOpponents, rng);
    const round = playRound(name, ties, rosters, rng, formation);
    rounds.push(round);
    survivors = round.ties.map((t) => t.winner);
  }

  return { rounds, champion: survivors[0]! };
}

function drawRound(clubs: string[], recentOpponents: Map<string, Set<string>>, rng: Rng): Array<[string, string]> {
  const pool = [...clubs];
  const pairs: Array<[string, string]> = [];
  const maxAttemptsPerDraw = 50;

  while (pool.length > 0) {
    const homeIdx = rng.int(0, pool.length - 1);
    const home = pool[homeIdx]!;
    let awayIdx = -1;
    for (let attempt = 0; attempt < maxAttemptsPerDraw; attempt++) {
      const candidateIdx = rng.int(0, pool.length - 1);
      if (candidateIdx === homeIdx) continue;
      const candidate = pool[candidateIdx]!;
      const recentlyMet = recentOpponents.get(home)?.has(candidate) ?? false;
      if (!recentlyMet || attempt === maxAttemptsPerDraw - 1) {
        awayIdx = candidateIdx;
        break;
      }
    }
    if (awayIdx === -1) {
      // sécurité : ne devrait pas arriver (pool > 1), on prend le premier autre club
      awayIdx = pool.findIndex((c) => c !== home);
    }
    const away = pool[awayIdx]!;
    pairs.push([home, away]);
    // retire les deux (indices décroissants pour ne pas se décaler)
    const higher = Math.max(homeIdx, awayIdx);
    const lower = Math.min(homeIdx, awayIdx);
    pool.splice(higher, 1);
    pool.splice(lower, 1);
  }
  return pairs;
}

function playRound(name: string, pairs: Array<[string, string]>, rosters: Map<string, Tireur[]>, rng: Rng, formation: FormationId): CupRound {
  const ties: CupTie[] = pairs.map(([home, away]) => {
    const result = simulateMatch({
      homeRoster: rosters.get(home)!,
      awayRoster: rosters.get(away)!,
      formation,
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: randomConditions(rng),
      rng,
    });
    const winner = result.homeScore === result.awayScore ? (rng.chance(0.5) ? home : away) : result.homeScore > result.awayScore ? home : away;
    return { home, away, result, winner };
  });
  return { name, ties };
}
