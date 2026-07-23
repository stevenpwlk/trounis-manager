import { describe, it, expect } from "vitest";
import { tacticsEffect } from "../src/engine/tactics";
import { bassinEffect } from "../src/engine/bassin";

describe("tacticsEffect", () => {
  it("offensif booste cavité/anchois et réduit l'apnée adverse", () => {
    const e = tacticsEffect({ tempo: "offensif", ciblage: "tenir-cavite", discipline: "jouer-propre" });
    expect(e.attackMult.cavite).toBeGreaterThan(1);
    expect(e.attackMult.anchois).toBeGreaterThan(1);
    expect(e.defenseMult.apnee).toBeLessThan(1);
  });

  it("prudent fait l'inverse d'offensif", () => {
    const e = tacticsEffect({ tempo: "prudent", ciblage: "tenir-cavite", discipline: "jouer-propre" });
    expect(e.defenseMult.apnee).toBeGreaterThan(1);
    expect(e.attackMult.cavite).toBeLessThan(1);
  });

  it("équilibré ne modifie rien", () => {
    const e = tacticsEffect({ tempo: "equilibre", ciblage: "tenir-cavite", discipline: "jouer-propre" });
    expect(e.attackMult.cavite ?? 1).toBe(1);
    expect(e.defenseMult.apnee ?? 1).toBe(1);
  });

  it("tenir-cavite réduit la variance", () => {
    const e = tacticsEffect({ tempo: "equilibre", ciblage: "tenir-cavite", discipline: "jouer-propre" });
    expect(e.varianceMult).toBeLessThan(1);
  });

  it("provoquer augmente le risque de saisine (soi-même et l'adversaire)", () => {
    const propre = tacticsEffect({ tempo: "equilibre", ciblage: "tenir-cavite", discipline: "jouer-propre" });
    const provoque = tacticsEffect({ tempo: "equilibre", ciblage: "tenir-cavite", discipline: "provoquer" });
    expect(provoque.ownSaisineRiskDelta).toBeGreaterThan(propre.ownSaisineRiskDelta);
    expect(provoque.oppSaisineRiskDelta).toBeGreaterThan(0);
  });
});

describe("bassinEffect", () => {
  it("salinité élevée renforce l'apnée", () => {
    const e = bassinEffect({ salinite: "elevee", paprika: "faible", risqueMarin: "faible" });
    expect(e.apneeMult).toBeGreaterThan(1);
  });

  it("paprika élevé réduit la cavité et renforce l'anchois", () => {
    const e = bassinEffect({ salinite: "moyenne", paprika: "eleve", risqueMarin: "faible" });
    expect(e.caviteMult).toBeLessThan(1);
    expect(e.anchoisMult).toBeGreaterThan(1);
  });

  it("risque marin élevé active une chance de déflecteur et renforce la discipline", () => {
    const e = bassinEffect({ salinite: "moyenne", paprika: "faible", risqueMarin: "eleve" });
    expect(e.deflectorChance).toBeGreaterThan(0);
    expect(e.disciplineMult).toBeGreaterThan(1);
  });

  it("conditions neutres ne modifient rien", () => {
    const e = bassinEffect({ salinite: "moyenne", paprika: "faible", risqueMarin: "faible" });
    expect(e.apneeMult).toBe(1);
    expect(e.caviteMult).toBe(1);
    expect(e.deflectorChance).toBe(0);
  });
});
