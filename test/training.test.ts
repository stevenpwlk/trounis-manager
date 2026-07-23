import { describe, it, expect } from "vitest";
import { applyCollectiveSession, applySpecificWork, applyWeeklyRecovery, applyPostMatchFatigue } from "../src/engine/training";
import type { Tireur } from "../src/data/types";
import { createRng } from "../src/engine/rng";

function makeTireur(overrides: Partial<Tireur> = {}): Tireur {
  return {
    id: "t1",
    name: "Test Tireur",
    clubCode: "TEST",
    age: 24,
    attrs: { cavite: 10, apnee: 10, anchois: 10, discipline: 10, souffle: 10 },
    trait: "silencieux-redoutable",
    isStar: false,
    forme: 80,
    ...overrides,
  };
}

describe("applyCollectiveSession", () => {
  it("fait progresser tout l'effectif sur l'attribut ciblé", () => {
    const roster = [makeTireur({ id: "a" }), makeTireur({ id: "b" })];
    applyCollectiveSession(roster, "cavite");
    for (const t of roster) expect(t.attrs.cavite).toBeGreaterThan(10);
  });

  it("ne touche pas les autres attributs", () => {
    const roster = [makeTireur()];
    applyCollectiveSession(roster, "cavite");
    expect(roster[0]!.attrs.apnee).toBe(10);
  });

  it("un tireur plus âgé progresse moins qu'un jeune (§7)", () => {
    const young = makeTireur({ id: "young", age: 22, attrs: { cavite: 10, apnee: 10, anchois: 10, discipline: 10, souffle: 10 } });
    const old = makeTireur({ id: "old", age: 34, attrs: { cavite: 10, apnee: 10, anchois: 10, discipline: 10, souffle: 10 } });
    applyCollectiveSession([young], "cavite");
    applyCollectiveSession([old], "cavite");
    const youngGain = young.attrs.cavite - 10;
    const oldGain = old.attrs.cavite - 10;
    expect(youngGain).toBeGreaterThan(oldGain);
    expect(oldGain).toBeGreaterThan(0); // progresse encore un peu, jamais totalement figé
  });

  it("rendements décroissants au-dessus de 15/20 (§7)", () => {
    const high = makeTireur({ attrs: { cavite: 16, apnee: 10, anchois: 10, discipline: 10, souffle: 10 } });
    const low = makeTireur({ attrs: { cavite: 10, apnee: 10, anchois: 10, discipline: 10, souffle: 10 } });
    applyCollectiveSession([high], "cavite");
    applyCollectiveSession([low], "cavite");
    expect(high.attrs.cavite - 16).toBeLessThan(low.attrs.cavite - 10);
  });

  it("reste borné à 20 même après de très nombreuses séances", () => {
    const t = makeTireur({ age: 20, attrs: { cavite: 19.5, apnee: 10, anchois: 10, discipline: 10, souffle: 10 } });
    for (let i = 0; i < 200; i++) applyCollectiveSession([t], "cavite");
    expect(t.attrs.cavite).toBeLessThanOrEqual(20);
  });
});

describe("applySpecificWork", () => {
  it("le travail spécifique fait progresser davantage qu'une séance collective", () => {
    const specific = makeTireur({ id: "s" });
    const collective = makeTireur({ id: "c" });
    applySpecificWork(specific, "anchois");
    applyCollectiveSession([collective], "anchois");
    expect(specific.attrs.anchois - 10).toBeGreaterThan(collective.attrs.anchois - 10);
  });
});

describe("applyWeeklyRecovery", () => {
  it("le tireur ménagé récupère plus vite que les autres", () => {
    const rested = makeTireur({ id: "rested", forme: 50 });
    const other = makeTireur({ id: "other", forme: 50 });
    applyWeeklyRecovery([rested, other], "rested");
    expect(rested.forme).toBeGreaterThan(other.forme);
  });

  it("la forme reste bornée à [0,100]", () => {
    const t = makeTireur({ forme: 98 });
    applyWeeklyRecovery([t], t.id);
    expect(t.forme).toBeLessThanOrEqual(100);
  });
});

describe("applyPostMatchFatigue", () => {
  it("réduit la forme des tireurs alignés, jamais sous 0", () => {
    const rng = createRng("fatigue-test");
    const lineup = [makeTireur({ id: "x", forme: 5 })];
    applyPostMatchFatigue(lineup, rng);
    expect(lineup[0]!.forme).toBeGreaterThanOrEqual(0);
    expect(lineup[0]!.forme).toBeLessThan(5);
  });
});
