import { describe, it, expect } from "vitest";
import { tireurValue, proposeBuy, sellPrice } from "../src/engine/mercato";
import { createRng } from "../src/engine/rng";
import type { Tireur } from "../src/data/types";

function makeTireur(overrides: Partial<Tireur> = {}): Tireur {
  return {
    id: "t1",
    name: "Test Tireur",
    clubCode: "TEST",
    age: 26,
    attrs: { cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 },
    trait: "silencieux-redoutable",
    isStar: false,
    forme: 90,
    ...overrides,
  };
}

describe("tireurValue", () => {
  it("un tireur aux meilleurs attributs vaut plus cher", () => {
    const strong = makeTireur({ attrs: { cavite: 18, apnee: 18, anchois: 18, discipline: 18, souffle: 18 } });
    const weak = makeTireur({ attrs: { cavite: 6, apnee: 6, anchois: 6, discipline: 6, souffle: 6 } });
    expect(tireurValue(strong)).toBeGreaterThan(tireurValue(weak));
  });

  it("une star vaut plus cher qu'un non-star à attributs égaux", () => {
    const star = makeTireur({ isStar: true });
    const regular = makeTireur({ isStar: false });
    expect(tireurValue(star)).toBeGreaterThan(tireurValue(regular));
  });

  it("un tireur en méforme vaut moins cher qu'en pleine forme", () => {
    const fit = makeTireur({ forme: 100 });
    const tired = makeTireur({ forme: 20 });
    expect(tireurValue(fit)).toBeGreaterThan(tireurValue(tired));
  });

  it("un joueur en fin de carrière (34+) vaut nettement moins qu'un joueur en pleine maturité (26-29)", () => {
    const veteran = makeTireur({ age: 35 });
    const prime = makeTireur({ age: 27 });
    expect(tireurValue(prime)).toBeGreaterThan(tireurValue(veteran));
  });

  it("la valeur est toujours positive", () => {
    const t = makeTireur({ attrs: { cavite: 1, apnee: 1, anchois: 1, discipline: 1, souffle: 1 }, age: 34, forme: 0 });
    expect(tireurValue(t)).toBeGreaterThan(0);
  });
});

describe("proposeBuy", () => {
  it("une offre au-dessus du prix demandé est acceptée immédiatement", () => {
    const t = makeTireur();
    const value = tireurValue(t);
    const result = proposeBuy(t, value * 2, { richClub: false, rng: createRng("buy-accept") });
    expect(result.outcome).toBe("accepted");
  });

  it("une offre raisonnable mais insuffisante déclenche une contre-offre (jamais une 2e contre-offre)", () => {
    const t = makeTireur();
    const value = tireurValue(t);
    const result = proposeBuy(t, Math.round(value * 0.75), { richClub: false, rng: createRng("buy-counter") });
    expect(result.outcome).toBe("countered");
    if (result.outcome === "countered") {
      expect(result.counterPrice).toBeGreaterThan(0);
    }
  });

  it("une offre dérisoire est rejetée sans contre-offre", () => {
    const t = makeTireur();
    const value = tireurValue(t);
    const result = proposeBuy(t, Math.round(value * 0.2), { richClub: false, rng: createRng("buy-reject") });
    expect(result.outcome).toBe("rejected");
  });

  it("un club riche demande une surcote (prix demandé plus élevé à offre égale)", () => {
    const t = makeTireur();
    const value = tireurValue(t);
    const offer = Math.round(value * 1.05);
    const poor = proposeBuy(t, offer, { richClub: false, rng: createRng("rich-1") });
    const rich = proposeBuy(t, offer, { richClub: true, rng: createRng("rich-2") });
    // à la même offre, un club riche a plus de chances de contrer/refuser (prix demandé plus haut)
    expect(poor.outcome).toBe("accepted");
    expect(rich.outcome).not.toBe("accepted");
  });
});

describe("sellPrice", () => {
  it("le prix de vente est inférieur à la valeur (décote, §8)", () => {
    const t = makeTireur();
    expect(sellPrice(t)).toBeLessThan(tireurValue(t));
  });
});
