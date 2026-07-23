import { createRng } from "../engine/rng";
import { generateClubRoster, averageAttr } from "../data/roster";
import { simulateMatch } from "../engine/match";
import { DEFAULT_CONSIGNES } from "../data/types";
import type { ConditionsBassin, FormationId } from "../data/types";
import { CLUBS, getClub } from "../data/clubs";
import { ATTR_KEYS } from "../data/types";

const NEUTRAL: ConditionsBassin = { salinite: "moyenne", paprika: "faible", risqueMarin: "faible" };
const FORMATIONS: FormationId[] = ["triangle", "losange", "libre", "carre-cercle"];
const TRIALS = 300;

console.log("=== Écart de performance par formation, par club (§14.1 : « un effectif ne peut pas être bon toute l'année ») ===\n");
console.log("Pour chaque club, marge moyenne (points marqués - points encaissés) sur 300 matchs face à un adversaire de référence neutre, dans chacune des 4 formations.\n");

// Adversaire de référence neutre : profil plat, force médiane
const referenceRng = createRng("reference-club");
const reference = generateClubRoster("SAL", referenceRng); // Salinité SC : profil équilibré, force médiane (75)

for (const club of CLUBS) {
  const rng = createRng(`formations-report-${club.code}`);
  const roster = generateClubRoster(club.code, rng);
  const line: string[] = [];
  for (const formation of FORMATIONS) {
    let totalMargin = 0;
    for (let i = 0; i < TRIALS; i++) {
      const result = simulateMatch({
        homeRoster: roster,
        awayRoster: reference,
        formation,
        homeConsignes: DEFAULT_CONSIGNES,
        awayConsignes: DEFAULT_CONSIGNES,
        conditions: NEUTRAL,
        rng: createRng(`formations-report-${club.code}-${formation}-${i}`),
      });
      totalMargin += result.homeScore - result.awayScore;
    }
    line.push(`${formation.padEnd(13)} ${(totalMargin / TRIALS).toFixed(1).padStart(6)}`);
  }
  const attrsLine = ATTR_KEYS.map((k) => `${k.slice(0, 3)}:${averageAttr(roster.filter((t) => !t.isStar), k).toFixed(1)}`).join(" ");
  console.log(`${club.name.padEnd(24)} [${attrsLine}]`);
  console.log(`  ${line.join("  |  ")}`);
  const values = line.map((l) => Number(l.split(/\s+/).pop()));
  const spread = Math.max(...values) - Math.min(...values);
  console.log(`  écart max entre formations : ${spread.toFixed(1)} points\n`);
}
