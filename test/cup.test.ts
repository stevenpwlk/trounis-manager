import { describe, it, expect } from "vitest";
import { simulateSeason } from "../src/engine/season";
import { simulateCup } from "../src/engine/cup";
import { createRng } from "../src/engine/rng";
import { L1_CODES, L2_CODES } from "../src/data/clubs";

describe("simulateCup", () => {
  it("produit exactement 5 tours (préliminaire, 8es, quarts, demis, finale) — §9/§28", () => {
    const season = simulateSeason("cup-rounds");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng"));
    expect(cup.rounds.map((r) => r.name)).toEqual(["Préliminaire", "8es de finale", "Quarts de finale", "Demi-finales", "Finale"]);
  });

  it("le tour préliminaire oppose 8 clubs de L2 (rangs 3-10) en 4 matchs", () => {
    const season = simulateSeason("cup-preliminary");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng-2"));
    const preliminary = cup.rounds[0]!;
    expect(preliminary.ties).toHaveLength(4);
    const l2Ranks3to10 = new Set(season.l2.standings.slice(2, 10).map((r) => r.code));
    for (const tie of preliminary.ties) {
      expect(l2Ranks3to10.has(tie.home) || l2Ranks3to10.has(tie.away)).toBe(true);
    }
  });

  it("les 8es de finale réunissent 16 clubs en 8 matchs", () => {
    const season = simulateSeason("cup-8es");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng-3"));
    expect(cup.rounds[1]!.ties).toHaveLength(8);
  });

  it("aucun club ne s'affronte lui-même à aucun tour", () => {
    const season = simulateSeason("cup-no-self");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng-4"));
    for (const round of cup.rounds) {
      for (const tie of round.ties) {
        expect(tie.home).not.toBe(tie.away);
      }
    }
  });

  it("désigne un champion unique parmi les 20 clubs", () => {
    const season = simulateSeason("cup-champion");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng-5"));
    expect([...L1_CODES, ...L2_CODES]).toContain(cup.champion);
  });

  it("le nombre de clubs se divise proprement par 2 à chaque tour (pas de bye)", () => {
    const season = simulateSeason("cup-halving");
    const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng("cup-rng-6"));
    const counts = cup.rounds.map((r) => r.ties.length * 2);
    expect(counts).toEqual([8, 16, 8, 4, 2]);
  });

  it("respecte la règle anti-redite quand deux clubs ne peuvent être tirés ensemble", () => {
    const season = simulateSeason("cup-anti-redite");
    const recentOpponents = new Map<string, Set<string>>();
    const [clubA, clubB] = season.l1.standings.map((r) => r.code);
    recentOpponents.set(clubA!, new Set([clubB!]));
    recentOpponents.set(clubB!, new Set([clubA!]));
    // Sur plusieurs tirages, A et B ne devraient (quasi) jamais se retrouver
    // au 1er tour où ils sont tous deux encore en lice (8es, les deux étant
    // qualifiés d'office). On vérifie juste que la contrainte est respectée
    // quand elle peut l'être (pool > 2).
    for (let i = 0; i < 20; i++) {
      const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, recentOpponents, createRng(`anti-redite-${i}`));
      const round8es = cup.rounds[1]!;
      const metInRound = round8es.ties.some((t) => (t.home === clubA && t.away === clubB) || (t.home === clubB && t.away === clubA));
      expect(metInRound).toBe(false);
    }
  });
});
