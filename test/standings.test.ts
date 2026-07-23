import { describe, it, expect } from "vitest";
import { createStandings, applyResult, sortedStandings } from "../src/engine/standings";
import type { MatchResult } from "../src/engine/match";

function fakeResult(homeScore: number, awayScore: number, homeAnchois = 0, awayAnchois = 0): MatchResult {
  const events: MatchResult["events"] = [];
  for (let i = 0; i < homeAnchois; i++) events.push({ period: 1, kind: "anchois", side: "home", homeDelta: 1, awayDelta: 0 });
  for (let i = 0; i < awayAnchois; i++) events.push({ period: 1, kind: "anchois", side: "away", homeDelta: 0, awayDelta: 1 });
  return {
    homeScore,
    awayScore,
    events,
    periods: [{ period: 1, home: homeScore, away: awayScore }],
    saisines: [],
    milestones: [],
    finalMomentum: 0,
  };
}

describe("standings", () => {
  it("victoire = 67 pts + anchois, défaite = 0 + anchois (barème canon §9/§18)", () => {
    const table = createStandings(["A", "B"]);
    applyResult(table, "A", "B", fakeResult(50, 40, 2, 1));
    const rows = sortedStandings(table);
    const a = rows.find((r) => r.code === "A")!;
    const b = rows.find((r) => r.code === "B")!;
    expect(a.leaguePoints).toBe(67 + 2);
    expect(b.leaguePoints).toBe(0 + 1);
    expect(a.wins).toBe(1);
    expect(b.losses).toBe(1);
  });

  it("match nul = 29 pts + anchois pour les deux", () => {
    const table = createStandings(["A", "B"]);
    applyResult(table, "A", "B", fakeResult(40, 40, 1, 3));
    const rows = sortedStandings(table);
    const a = rows.find((r) => r.code === "A")!;
    const b = rows.find((r) => r.code === "B")!;
    expect(a.leaguePoints).toBe(29 + 1);
    expect(b.leaguePoints).toBe(29 + 3);
    expect(a.draws).toBe(1);
    expect(b.draws).toBe(1);
  });

  it("trie par points de ligue décroissants, puis différence, puis pour", () => {
    const table = createStandings(["A", "B", "C"]);
    applyResult(table, "A", "B", fakeResult(60, 30)); // A: 67, B: 0
    applyResult(table, "C", "B", fakeResult(35, 35)); // C: 29, B: 29
    const rows = sortedStandings(table);
    expect(rows.map((r) => r.code)).toEqual(["A", "C", "B"]);
  });

  it("played s'incrémente correctement pour les deux équipes", () => {
    const table = createStandings(["A", "B"]);
    applyResult(table, "A", "B", fakeResult(50, 20));
    applyResult(table, "B", "A", fakeResult(10, 60));
    const rows = sortedStandings(table);
    for (const r of rows) expect(r.played).toBe(2);
  });
});
