import { describe, it, expect } from "vitest";
import { evaluateObjective } from "../src/engine/objective";

describe("evaluateObjective", () => {
  it("un titre est toujours un Exploit, même si l'objectif était modeste", () => {
    expect(evaluateObjective({ finalRank: 1, targetRank: 8, wonTitle: true })).toBe("exploit");
  });

  it("gagner la Coupe est aussi un Exploit", () => {
    expect(evaluateObjective({ finalRank: 5, targetRank: 6, wonCup: true })).toBe("exploit");
  });

  it("finir nettement mieux que l'objectif (marge >=3) = Exploit", () => {
    expect(evaluateObjective({ finalRank: 2, targetRank: 6 })).toBe("exploit");
  });

  it("finir dans la marge de l'objectif (±2) = Conforme", () => {
    expect(evaluateObjective({ finalRank: 6, targetRank: 6 })).toBe("conforme");
    expect(evaluateObjective({ finalRank: 8, targetRank: 6 })).toBe("conforme");
    expect(evaluateObjective({ finalRank: 4, targetRank: 6 })).toBe("conforme");
  });

  it("finir nettement moins bien que l'objectif = Échec", () => {
    expect(evaluateObjective({ finalRank: 9, targetRank: 3 })).toBe("echec");
  });

  it("cas Goudufist : viser le titre (rang 1) et finir 4e = Échec", () => {
    expect(evaluateObjective({ finalRank: 4, targetRank: 1 })).toBe("echec");
  });

  it("cas Anchois Albion : viser le rang 10 (le pire) et finir 8e = Conforme (marge de 2)", () => {
    expect(evaluateObjective({ finalRank: 8, targetRank: 10 })).toBe("conforme");
  });

  it("cas Anchois Albion : viser le rang 10 et finir 6e (marge de 4) = Exploit", () => {
    expect(evaluateObjective({ finalRank: 6, targetRank: 10 })).toBe("exploit");
  });
});
