import { simulateSeason } from "../engine/season";
import { getClub, CLUBS } from "../data/clubs";

const N = Number(process.argv[2] ?? 100);

const championCounts = new Map<string, number>();
const l1WinCountsByForceRank = new Map<string, number>(); // code -> nb de titres L1
const allMatchTotals: number[] = [];
const allMatchMargins: number[] = [];
let zeroWinSeasons = 0;
let perfectSeasons = 0;
const finalRankByClub = new Map<string, number[]>();

for (let i = 0; i < N; i++) {
  const season = simulateSeason(`balance-${i}`);
  const l1Champion = season.l1.standings[0]!.code;
  championCounts.set(l1Champion, (championCounts.get(l1Champion) ?? 0) + 1);
  l1WinCountsByForceRank.set(l1Champion, (l1WinCountsByForceRank.get(l1Champion) ?? 0) + 1);

  for (const [rankIdx, row] of season.l1.standings.entries()) {
    if (row.wins === 0) zeroWinSeasons++;
    if (row.losses === 0 && row.draws === 0) perfectSeasons++;
    const arr = finalRankByClub.get(row.code) ?? [];
    arr.push(rankIdx + 1);
    finalRankByClub.set(row.code, arr);
  }
  for (const row of season.l2.standings) {
    const arr = finalRankByClub.get(row.code) ?? [];
    arr.push(-1); // marqueur : classé en L2 cette saison-là (pas de rang comparable direct)
    finalRankByClub.set(row.code, arr);
  }

  for (const fixture of [...season.l1.fixtures, ...season.l2.fixtures]) {
    allMatchTotals.push(fixture.result.homeScore + fixture.result.awayScore);
    allMatchMargins.push(Math.abs(fixture.result.homeScore - fixture.result.awayScore));
  }
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)]!;
}

console.log(`=== Rapport d'équilibrage sur ${N} saisons simulées ===\n`);

console.log("--- Champions de Ligue 1 (triés par force lore décroissante) ---");
const byForce = [...CLUBS].filter((c) => c.league === "L1").sort((a, b) => b.forceLore - a.forceLore);
for (const club of byForce) {
  const wins = championCounts.get(club.code) ?? 0;
  const pct = ((wins / N) * 100).toFixed(1);
  console.log(`${club.name.padEnd(24)} force ${String(club.forceLore).padStart(2)}  ${String(wins).padStart(3)} titres (${pct}%)`);
}
const nonTopChampions = [...championCounts.entries()].filter(([code]) => {
  const rank = byForce.findIndex((c) => c.code === code);
  return rank > 2; // hors top 3 de force
});
console.log(`\nClubs hors du top 3 de force ayant été champions au moins une fois : ${nonTopChampions.length > 0 ? nonTopChampions.map(([c, n]) => `${getClub(c).name} (${n}x)`).join(", ") : "aucun"}`);

console.log("\n--- Scores de match (toutes ligues confondues) ---");
console.log(`Total moyen (les deux équipes) : ${mean(allMatchTotals).toFixed(1)}`);
console.log(`Total médian                   : ${percentile(allMatchTotals, 0.5)}`);
console.log(`Total P10 / P90                : ${percentile(allMatchTotals, 0.1)} / ${percentile(allMatchTotals, 0.9)}`);
console.log(`Écart moyen (marge de victoire) : ${mean(allMatchMargins).toFixed(1)}`);
console.log(`Part de matchs serrés (marge <=6) : ${((allMatchMargins.filter((m) => m <= 6).length / allMatchMargins.length) * 100).toFixed(1)}%`);

console.log("\n--- Extrêmes de saison (sur les classements L1) ---");
console.log(`Saisons à 0 victoire (sur ${N * 10} lignes de classement L1) : ${zeroWinSeasons} (${((zeroWinSeasons / (N * 10)) * 100).toFixed(2)}%)`);
console.log(`Saisons invaincues (sur ${N * 10} lignes)                    : ${perfectSeasons} (${((perfectSeasons / (N * 10)) * 100).toFixed(2)}%)`);

console.log("\n--- Rang moyen en L1 par club (si présent en L1 cette saison-là) ---");
for (const club of byForce) {
  const ranks = (finalRankByClub.get(club.code) ?? []).filter((r) => r > 0);
  if (ranks.length === 0) continue;
  console.log(`${club.name.padEnd(24)} force ${String(club.forceLore).padStart(2)}  rang moyen ${mean(ranks).toFixed(2)}  (${ranks.length} saisons en L1)`);
}
