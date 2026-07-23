import { describe, it, expect } from "vitest";
import { simulateSeason, applyPromotionRelegation } from "../src/engine/season";
import { L1_CODES, L2_CODES } from "../src/data/clubs";

describe("simulateSeason", () => {
  it("produit un classement de 10 lignes pour chaque ligue", () => {
    const season = simulateSeason("season-basic");
    expect(season.l1.standings).toHaveLength(10);
    expect(season.l2.standings).toHaveLength(10);
  });

  it("chaque club joue exactement 18 matchs (§9)", () => {
    const season = simulateSeason("season-played");
    for (const row of [...season.l1.standings, ...season.l2.standings]) {
      expect(row.played).toBe(18);
    }
  });

  it("les classements contiennent exactement les clubs attendus de chaque ligue", () => {
    const season = simulateSeason("season-codes");
    expect(new Set(season.l1.standings.map((r) => r.code))).toEqual(new Set(L1_CODES));
    expect(new Set(season.l2.standings.map((r) => r.code))).toEqual(new Set(L2_CODES));
  });

  it("génère un effectif pour les 20 clubs", () => {
    const season = simulateSeason("season-rosters");
    expect(season.rosters.size).toBe(20);
    for (const code of [...L1_CODES, ...L2_CODES]) {
      expect(season.rosters.get(code)).toHaveLength(10);
    }
  });

  it("est déterministe : même seed -> même saison (standings identiques)", () => {
    const a = simulateSeason("season-determinism");
    const b = simulateSeason("season-determinism");
    expect(a.l1.standings).toEqual(b.l1.standings);
    expect(a.l2.standings).toEqual(b.l2.standings);
    expect(a.barrage.winner).toBe(b.barrage.winner);
  });

  it("le barrage oppose bien le 8e de L1 et le 3e de L2 (§9)", () => {
    const season = simulateSeason("season-barrage");
    expect(season.barrage.home).toBe(season.l1.standings[7]!.code);
    expect(season.barrage.away).toBe(season.l2.standings[2]!.code);
  });
});

describe("applyPromotionRelegation", () => {
  it("produit toujours 10 clubs par ligue, sans doublon ni chevauchement", () => {
    for (const seed of ["promo-1", "promo-2", "promo-3", "promo-4", "promo-5"]) {
      const season = simulateSeason(seed);
      const { l1, l2 } = applyPromotionRelegation(season);
      expect(l1).toHaveLength(10);
      expect(l2).toHaveLength(10);
      expect(new Set(l1).size).toBe(10);
      expect(new Set(l2).size).toBe(10);
      const overlap = l1.filter((c) => l2.includes(c));
      expect(overlap).toHaveLength(0);
      // les 20 clubs canoniques doivent tous être présents quelque part
      expect(new Set([...l1, ...l2])).toEqual(new Set([...L1_CODES, ...L2_CODES]));
    }
  });

  it("les 2 derniers de L1 ne sont jamais maintenus si le barrage ne les concerne pas", () => {
    const season = simulateSeason("promo-relegation-check");
    const relegated = season.l1.standings.slice(8, 10).map((r) => r.code);
    const { l1 } = applyPromotionRelegation(season);
    for (const code of relegated) expect(l1).not.toContain(code);
  });

  it("les 2 premiers de L2 sont toujours promus", () => {
    const season = simulateSeason("promo-check-2");
    const promoted = season.l2.standings.slice(0, 2).map((r) => r.code);
    const { l1 } = applyPromotionRelegation(season);
    for (const code of promoted) expect(l1).toContain(code);
  });
});
