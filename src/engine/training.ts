import type { AttrKey, Tireur } from "../data/types";

/**
 * Les 3 gestes d'entraînement (§7). Attributs stockés en float en interne
 * (le type `Attributes` n'impose pas d'entier) — seul l'affichage arrondit ;
 * ça permet des gains hebdomadaires progressifs sans qu'ils disparaissent
 * dans l'arrondi. Garde-fous : rendements décroissants au-dessus de 15/20,
 * progression pondérée par l'âge (un tireur de 34 ans ne progresse quasi
 * plus, cf. §7).
 */

function ageProgressionFactor(age: number): number {
  if (age <= 27) return 1;
  if (age >= 33) return 0.1;
  return 1 - ((age - 27) / 6) * 0.9;
}

function diminishingFactor(currentValue: number): number {
  return currentValue >= 15 ? 0.3 : 1;
}

const COLLECTIVE_BASE_GAIN = 0.35;
const SPECIFIC_BASE_GAIN = 1.3;
const REST_BASE_RECOVERY = 8;
const REST_TARGETED_RECOVERY = 18;
const MATCH_FATIGUE_MIN = 8;
const MATCH_FATIGUE_MAX = 16;

function clampAttr(value: number): number {
  return Math.max(1, Math.min(20, value));
}

function clampForme(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Geste 1 : séance collective — tout l'effectif progresse un peu sur un attribut. */
export function applyCollectiveSession(roster: Tireur[], attr: AttrKey): void {
  for (const t of roster) {
    const gain = COLLECTIVE_BASE_GAIN * ageProgressionFactor(t.age) * diminishingFactor(t.attrs[attr]);
    t.attrs[attr] = clampAttr(t.attrs[attr] + gain);
  }
}

/** Geste 2 : travail spécifique — un tireur ciblé progresse fortement sur un attribut. */
export function applySpecificWork(tireur: Tireur, attr: AttrKey): void {
  const gain = SPECIFIC_BASE_GAIN * ageProgressionFactor(tireur.age) * diminishingFactor(tireur.attrs[attr]);
  tireur.attrs[attr] = clampAttr(tireur.attrs[attr] + gain);
}

/**
 * Geste 3 (ménagé) + récupération hebdomadaire de fond : à appeler une fois
 * par tour pour tout l'effectif, `restedId` désigne le tireur ménagé cette
 * semaine (récupère à vitesse double, §7).
 */
export function applyWeeklyRecovery(roster: Tireur[], restedId: string | null): void {
  for (const t of roster) {
    const recovery = t.id === restedId ? REST_TARGETED_RECOVERY : REST_BASE_RECOVERY;
    t.forme = clampForme(t.forme + recovery);
  }
}

/** Fatigue post-match : à appliquer aux tireurs alignés après simulation du match. */
export function applyPostMatchFatigue(lineup: Tireur[], rng: { int(min: number, max: number): number }): void {
  for (const t of lineup) {
    t.forme = clampForme(t.forme - rng.int(MATCH_FATIGUE_MIN, MATCH_FATIGUE_MAX));
  }
}
