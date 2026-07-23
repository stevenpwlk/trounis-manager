import { describe, it, expect } from "vitest";
import { createRng } from "../src/engine/rng";

describe("rng", () => {
  it("est déterministe : même seed -> même séquence", () => {
    const a = createRng("saison-1");
    const b = createRng("saison-1");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("des seeds différentes divergent", () => {
    const a = createRng("saison-1");
    const b = createRng("saison-2");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("next() reste dans [0,1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 2000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int() respecte les bornes inclusives", () => {
    const rng = createRng("bounds");
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(5, 8);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it("chance(0) ne déclenche jamais, chance(1) toujours", () => {
    const rng = createRng("chance");
    for (let i = 0; i < 200; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it("noise() reste borné à ±spread", () => {
    const rng = createRng("noise");
    for (let i = 0; i < 2000; i++) {
      const v = rng.noise(3);
      expect(Math.abs(v)).toBeLessThanOrEqual(3);
    }
  });
});
