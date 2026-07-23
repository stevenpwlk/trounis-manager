import { simulateSeason, applyPromotionRelegation } from "../engine/season";
import { simulateCup } from "../engine/cup";
import { createRng } from "../engine/rng";
import { getClub } from "../data/clubs";
import type { StandingRow } from "../engine/standings";

const seed = process.argv[2] ?? "rapport-saison-1";
const season = simulateSeason(seed);

function printTable(title: string, rows: StandingRow[]) {
  console.log(`\n=== ${title} ===`);
  console.log(
    "Rg  Club                      MJ   V   N   D   Pour Ctre  Anch  Pts"
  );
  rows.forEach((r, i) => {
    const club = getClub(r.code);
    console.log(
      `${String(i + 1).padStart(2)}  ${club.name.padEnd(24)}  ${String(r.played).padStart(2)}  ${String(r.wins).padStart(2)}  ${String(r.draws).padStart(2)}  ${String(r.losses).padStart(2)}  ${String(r.pointsFor).padStart(4)} ${String(r.pointsAgainst).padStart(4)}  ${String(r.anchoisBonus).padStart(4)}  ${String(r.leaguePoints).padStart(4)}`
    );
  });
}

console.log(`Seed: ${seed}`);
printTable("Ligue 1 Connetable", season.l1.standings);
printTable("Ligue 2 Capitaine Cook", season.l2.standings);

console.log(`\n=== Barrage ===`);
console.log(
  `${getClub(season.barrage.home).name} (8e L1) ${season.barrage.result.homeScore} - ${season.barrage.result.awayScore} ${getClub(season.barrage.away).name} (3e L2)`
);
console.log(`Vainqueur : ${getClub(season.barrage.winner).name}`);

const { l1: newL1, l2: newL2 } = applyPromotionRelegation(season);
console.log(`\n=== Mouvements ===`);
console.log(`Relégués en L2 : ${season.l1.standings.slice(8, 10).map((r) => getClub(r.code).name).join(", ")}`);
console.log(`Promus en L1   : ${season.l2.standings.slice(0, 2).map((r) => getClub(r.code).name).join(", ")}`);
console.log(`Nouvelle L1 : ${newL1.map((c) => getClub(c).name).join(", ")}`);
console.log(`Nouvelle L2 : ${newL2.map((c) => getClub(c).name).join(", ")}`);

const cup = simulateCup(season.l1.standings, season.l2.standings, season.rosters, new Map(), createRng(`${seed}-coupe`));
console.log(`\n=== Coupe de la F.I.S.T. ===`);
for (const round of cup.rounds) {
  console.log(`\n-- ${round.name} --`);
  for (const tie of round.ties) {
    console.log(
      `${getClub(tie.home).name} ${tie.result.homeScore} - ${tie.result.awayScore} ${getClub(tie.away).name}  (vainqueur: ${getClub(tie.winner).name})`
    );
  }
}
console.log(`\nChampion de la Coupe : ${getClub(cup.champion).name}`);

// Aperçu d'un match détaillé (le premier de la journée 1 en L1)
const sampleMatch = season.l1.fixtures[0]!;
console.log(`\n=== Aperçu détaillé : J1, ${getClub(sampleMatch.home).name} - ${getClub(sampleMatch.away).name} ===`);
console.log(`Score final : ${sampleMatch.result.homeScore} - ${sampleMatch.result.awayScore}`);
console.log("Périodes :", sampleMatch.result.periods.map((p) => `P${p.period}: ${p.home}-${p.away}`).join(" | "));
console.log("Milestones :", sampleMatch.result.milestones.join(", ") || "(aucun)");
console.log("Saisines :", sampleMatch.result.saisines.length);
console.log("Momentum final :", sampleMatch.result.finalMomentum.toFixed(1));
