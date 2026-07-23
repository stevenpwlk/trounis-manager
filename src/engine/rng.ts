/**
 * PRNG mulberry32 — même famille que le moteur de storyboards v2 de l'app pronos
 * (lib/data/generator/rng.ts), reconstruit ici (fork, pas partage, cf. plan §12).
 * Déterministe : même seed + mêmes appels -> même séquence, condition nécessaire
 * pour la revalidation serveur (plan §12).
 */
export type Rng = {
  next(): number; // [0, 1)
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  /** Bruit centré sur 0, borné à ±spread. */
  noise(spread: number): number;
};

export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  let a = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;

  function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(minInclusive: number, maxInclusive: number): number {
    return minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("pick: liste vide");
    return items[int(0, items.length - 1)] as T;
  }

  function chance(probability: number): boolean {
    return next() < probability;
  }

  function noise(spread: number): number {
    // somme de deux tirages uniformes -> triangulaire, plus centrée que l'uniforme pur
    return (next() + next() - 1) * spread;
  }

  return { next, int, pick, chance, noise };
}
