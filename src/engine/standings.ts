import type { MatchResult } from "./match";

export type StandingRow = {
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  anchoisBonus: number;
  leaguePoints: number;
};

/** Barème canon (trounis.fr / plan §9-§18) : victoire 67, nul 29, défaite 0, +1/anchois. */
const WIN_PTS = 67;
const DRAW_PTS = 29;
const LOSS_PTS = 0;

export function createStandings(codes: string[]): Map<string, StandingRow> {
  const table = new Map<string, StandingRow>();
  for (const code of codes) {
    table.set(code, {
      code,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      anchoisBonus: 0,
      leaguePoints: 0,
    });
  }
  return table;
}

function anchoisCount(result: MatchResult, side: "home" | "away"): number {
  return result.events.filter((e) => e.kind === "anchois" && e.side === side).length;
}

export function applyResult(table: Map<string, StandingRow>, homeCode: string, awayCode: string, result: MatchResult): void {
  const home = table.get(homeCode);
  const away = table.get(awayCode);
  if (!home || !away) throw new Error("Club absent du classement");

  home.played++;
  away.played++;
  home.pointsFor += result.homeScore;
  home.pointsAgainst += result.awayScore;
  away.pointsFor += result.awayScore;
  away.pointsAgainst += result.homeScore;

  const homeAnchois = anchoisCount(result, "home");
  const awayAnchois = anchoisCount(result, "away");
  home.anchoisBonus += homeAnchois;
  away.anchoisBonus += awayAnchois;

  if (result.homeScore > result.awayScore) {
    home.wins++;
    away.losses++;
    home.leaguePoints += WIN_PTS + homeAnchois;
    away.leaguePoints += LOSS_PTS + awayAnchois;
  } else if (result.homeScore < result.awayScore) {
    away.wins++;
    home.losses++;
    away.leaguePoints += WIN_PTS + awayAnchois;
    home.leaguePoints += LOSS_PTS + homeAnchois;
  } else {
    home.draws++;
    away.draws++;
    home.leaguePoints += DRAW_PTS + homeAnchois;
    away.leaguePoints += DRAW_PTS + awayAnchois;
  }
}

export function sortedStandings(table: Map<string, StandingRow>): StandingRow[] {
  return [...table.values()].sort((a, b) => {
    if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
}
