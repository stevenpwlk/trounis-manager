import { describe, it, expect } from "vitest";
import { generateDoubleRoundRobin } from "../src/engine/schedule";

describe("generateDoubleRoundRobin", () => {
  const codes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]; // 10 clubs, comme L1/L2

  it("produit n*(n-1) matchs pour n clubs (90 pour 10 clubs)", () => {
    const fixtures = generateDoubleRoundRobin(codes);
    expect(fixtures).toHaveLength(90);
  });

  it("chaque paire s'affronte exactement 2 fois (une fois à domicile chacune)", () => {
    const fixtures = generateDoubleRoundRobin(codes);
    for (const a of codes) {
      for (const b of codes) {
        if (a === b) continue;
        const aHome = fixtures.filter((f) => f.home === a && f.away === b).length;
        expect(aHome).toBe(1);
      }
    }
  });

  it("18 journées, 5 matchs par journée", () => {
    const fixtures = generateDoubleRoundRobin(codes);
    const byJournee = new Map<number, number>();
    for (const f of fixtures) byJournee.set(f.journee, (byJournee.get(f.journee) ?? 0) + 1);
    expect([...byJournee.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    for (const count of byJournee.values()) expect(count).toBe(5);
  });

  it("aucun club ne joue contre lui-même", () => {
    const fixtures = generateDoubleRoundRobin(codes);
    for (const f of fixtures) expect(f.home).not.toBe(f.away);
  });

  it("chaque club joue exactement une fois par journée", () => {
    const fixtures = generateDoubleRoundRobin(codes);
    for (let j = 1; j <= 18; j++) {
      const clubsThisJournee = fixtures.filter((f) => f.journee === j).flatMap((f) => [f.home, f.away]);
      expect(new Set(clubsThisJournee).size).toBe(10);
    }
  });
});
