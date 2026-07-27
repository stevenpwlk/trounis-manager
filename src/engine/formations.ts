import type { Attributes, FormationId, SeasonSegment } from "../data/types";

/** Formation imposée par la saison — règlement, pas un choix (plan §5). */
export const FORMATION_BY_SEASON: Record<SeasonSegment, FormationId> = {
  printemps: "triangle",
  ete: "losange",
  automne: "libre",
  hiver: "carre-cercle",
};

/** Map inverse — utile aux effets de terroir saisonnier des traits (§15) qui ne connaissent
 * que la formation en vigueur, pas directement le segment de saison. */
export const SEGMENT_BY_FORMATION: Record<FormationId, SeasonSegment> = {
  triangle: "printemps",
  losange: "ete",
  libre: "automne",
  "carre-cercle": "hiver",
};

/** Nombre de tireurs alignés par formation (§5). Carré-en-cercle = 4 + 1 pivot. */
export const SLOTS_BY_FORMATION: Record<FormationId, number> = {
  triangle: 3,
  losange: 4,
  libre: 5,
  "carre-cercle": 5,
};

/** Poids d'attributs par formation (§16, première passe de calibrage). */
export const FORMATION_WEIGHTS: Record<FormationId, Attributes> = {
  triangle: { cavite: 1.3, apnee: 1.3, anchois: 0.7, discipline: 1.0, souffle: 0.8 },
  losange: { cavite: 1.0, apnee: 1.0, anchois: 1.4, discipline: 1.0, souffle: 1.0 },
  libre: { cavite: 1.1, apnee: 0.9, anchois: 1.0, discipline: 0.9, souffle: 1.4 },
  "carre-cercle": { cavite: 0.9, apnee: 1.2, anchois: 0.8, discipline: 1.4, souffle: 1.0 },
};

/** Poids additionnel du souffle par période (P1→P4), §16. */
export const SOUFFLE_PERIOD_MULT: readonly [number, number, number, number] = [0.7, 0.9, 1.1, 1.4];

/** Découpage des 18 journées par segment de saison (§9 : 5/4/5/4). */
export const JOURNEES_BY_SEGMENT: Record<SeasonSegment, number> = {
  printemps: 5,
  ete: 4,
  automne: 5,
  hiver: 4,
};

export const SEASON_ORDER: readonly SeasonSegment[] = ["printemps", "ete", "automne", "hiver"];

/** Retourne le segment de saison (et la formation imposée) pour une journée 1..18. */
export function segmentForJournee(journee: number): SeasonSegment {
  let acc = 0;
  for (const seg of SEASON_ORDER) {
    acc += JOURNEES_BY_SEGMENT[seg];
    if (journee <= acc) return seg;
  }
  throw new Error(`Journée hors calendrier: ${journee}`);
}

/** Les 2 fenêtres de mercato (§8) : la grande à l'intersaison (J1-2), la courte d'hiver
 * juste avant la bascule automne→hiver (J14-15). Hors fenêtre, le mercato est fermé. */
const MERCATO_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [1, 2],
  [14, 15],
];

export function isMercatoOpen(journee: number): boolean {
  return MERCATO_WINDOWS.some(([start, end]) => journee >= start && journee <= end);
}

/** Prochaine journée d'ouverture du mercato, pour l'affichage ("fenêtre fermée, réouverture J.X"). */
export function nextMercatoWindowStart(journee: number): number | null {
  const next = MERCATO_WINDOWS.map(([start]) => start).find((start) => start > journee);
  return next ?? null;
}

/** Vrai uniquement au premier jour d'une fenêtre — moment où l'IA fait ses mouvements de mercato (étape D). */
export function isMercatoWindowStart(journee: number): boolean {
  return MERCATO_WINDOWS.some(([start]) => start === journee);
}
