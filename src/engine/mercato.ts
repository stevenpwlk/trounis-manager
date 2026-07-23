import type { Tireur } from "../data/types";
import { ATTR_KEYS } from "../data/types";
import type { Rng } from "./rng";

/**
 * Valeur estimée d'un tireur (§8) : dérivée des attributs, pondérée par
 * l'âge (pic ~24-29) et la forme. Échelle en Anchois d'Or, calée pour
 * qu'un joueur médian (attributs ~12, 26 ans) vaille dans les dizaines
 * d'Ⱥ — cohérent avec les budgets de départ des clubs (§18, 300-1100 Ⱥ).
 */
export function tireurValue(t: Tireur): number {
  const attrSum = ATTR_KEYS.reduce((sum, k) => sum + t.attrs[k], 0); // ~20-100
  const ageFactor = ageValueFactor(t.age);
  const formeFactor = 0.7 + (t.forme / 100) * 0.3;
  const starPremium = t.isStar ? 1.4 : 1;
  return Math.round(attrSum * 0.9 * ageFactor * formeFactor * starPremium);
}

function ageValueFactor(age: number): number {
  if (age <= 20) return 0.75; // jeune : valeur actuelle modeste (le potentiel n'est pas chiffré, §23)
  if (age <= 23) return 0.85 + (age - 20) * 0.05;
  if (age <= 29) return 1.0;
  if (age <= 33) return 1.0 - (age - 29) * 0.13;
  return 0.35;
}

export type OfferResult =
  | { outcome: "accepted"; price: number }
  | { outcome: "countered"; counterPrice: number }
  | { outcome: "rejected" };

/**
 * Une offre d'achat sur un tireur d'un club IA (§8) : accord immédiat si
 * l'offre couvre le prix demandé, sinon une seule contre-offre (à prendre
 * ou à laisser — pas de négociation multi-tours).
 */
export function proposeBuy(tireur: Tireur, offer: number, opts: { richClub: boolean; rng: Rng }): OfferResult {
  const value = tireurValue(tireur);
  const surcote = opts.richClub ? 1.2 : 1.0;
  const askingPrice = Math.round(value * surcote);

  if (offer >= askingPrice) return { outcome: "accepted", price: offer };

  const counterPrice = Math.round((askingPrice + offer) / 2);
  // en dessous de 60% du prix demandé, le club refuse même de contre-offrir
  if (offer < askingPrice * 0.6) return { outcome: "rejected" };
  return { outcome: "countered", counterPrice };
}

/** Accepter une contre-offre : décision de l'appelant (le joueur), pas du moteur. */
export function acceptCounter(counterPrice: number): OfferResult {
  return { outcome: "accepted", price: counterPrice };
}

/** Vente d'un tireur du club du joueur (§8) : valeur - décote. */
export function sellPrice(tireur: Tireur): number {
  return Math.round(tireurValue(tireur) * 0.85);
}
