import { describe, it, expect } from "vitest";
import { createRng } from "../src/engine/rng";
import { generateClubRoster } from "../src/data/roster";
import { CLUBS } from "../src/data/clubs";
import { STARS } from "../src/data/stars";
import { ATTR_KEYS } from "../src/data/types";

describe("génération d'effectif", () => {
  it("génère exactement 10 tireurs par club, pour les 20 clubs", () => {
    const rng = createRng("roster-count");
    for (const club of CLUBS) {
      const roster = generateClubRoster(club.code, rng);
      expect(roster).toHaveLength(10);
    }
  });

  it("tous les attributs sont dans [4,20]", () => {
    const rng = createRng("roster-bounds");
    for (const club of CLUBS) {
      const roster = generateClubRoster(club.code, rng);
      for (const t of roster) {
        for (const key of ATTR_KEYS) {
          expect(t.attrs[key]).toBeGreaterThanOrEqual(4);
          expect(t.attrs[key]).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it("les stars canoniques conservent exactement leurs attributs/trait/surnom du plan §17", () => {
    const rng = createRng("roster-stars");
    const roster = generateClubRoster("ABR", rng);
    const star = roster.find((t) => t.name === "Alain Chovy");
    expect(star).toBeDefined();
    expect(star!.isStar).toBe(true);
    expect(star!.trait).toBe("fidele-au-poste");
    expect(star!.surnom).toBe("l'Ancre");
    expect(star!.attrs).toEqual({ cavite: 12, apnee: 14, anchois: 18, discipline: 13, souffle: 15 });
  });

  it("exactement 16 stars au total sur les 20 clubs (§17)", () => {
    const rng = createRng("roster-star-count");
    let total = 0;
    for (const club of CLUBS) {
      const roster = generateClubRoster(club.code, rng);
      total += roster.filter((t) => t.isStar).length;
    }
    expect(total).toBe(STARS.length);
    expect(total).toBe(16);
  });

  it("les 8 nouveaux clubs de L2 n'ont aucune star (§17)", () => {
    const rng = createRng("roster-l2-no-star");
    const newL2 = ["FJO", "VOR", "ATL", "COR", "POS", "WAV", "NAP", "ALB"];
    for (const code of newL2) {
      const roster = generateClubRoster(code, rng);
      expect(roster.some((t) => t.isStar)).toBe(false);
    }
  });

  it("un club plus fort (force lore) génère en moyenne de meilleurs attributs qu'un club faible", () => {
    const rng = createRng("roster-strength-correlation");
    // Goudufist (92) vs Anchois Albion (45), sur les tireurs non-stars uniquement
    // pour ne pas laisser les stars canoniques biaiser la comparaison.
    const strong = generateClubRoster("GOU", rng).filter((t) => !t.isStar);
    const weak = generateClubRoster("ALB", rng).filter((t) => !t.isStar);
    const avg = (roster: typeof strong) =>
      roster.reduce((sum, t) => sum + ATTR_KEYS.reduce((s, k) => s + t.attrs[k], 0) / ATTR_KEYS.length, 0) / roster.length;
    expect(avg(strong)).toBeGreaterThan(avg(weak));
  });

  it("est déterministe : même seed -> même effectif généré", () => {
    const rosterA = generateClubRoster("NAP", createRng("determinism-check"));
    const rosterB = generateClubRoster("NAP", createRng("determinism-check"));
    expect(rosterA).toEqual(rosterB);
  });
});
