export type Fixture = { journee: number; home: string; away: string };

/**
 * Calendrier aller-retour pour N clubs (méthode du cercle) — 18 journées
 * pour 10 clubs (§9). Un club "fantôme" est ajouté si N est impair (aucun
 * cas prévu ici : les 2 ligues ont 10 clubs chacune).
 */
export function generateDoubleRoundRobin(codes: string[]): Fixture[] {
  const teams = [...codes];
  if (teams.length % 2 !== 0) teams.push("BYE");
  const n = teams.length;
  const rounds: Fixture[][] = [];

  const fixed = teams[0]!;
  let rest = teams.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const roundTeams = [fixed, ...rest];
    const roundFixtures: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = roundTeams[i]!;
      const away = roundTeams[n - 1 - i]!;
      if (home !== "BYE" && away !== "BYE") {
        // alterne le sens domicile/extérieur selon la parité du round pour
        // équilibrer les réceptions sur la phase aller
        const swap = r % 2 === 1;
        roundFixtures.push({ journee: r + 1, home: swap ? away : home, away: swap ? home : away });
      }
    }
    rounds.push(roundFixtures);
    rest = [rest[rest.length - 1]!, ...rest.slice(0, -1)];
  }

  const firstLeg = rounds.flat();
  const secondLeg = firstLeg.map((f) => ({ journee: f.journee + (n - 1), home: f.away, away: f.home }));
  return [...firstLeg, ...secondLeg];
}
