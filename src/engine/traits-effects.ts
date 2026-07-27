import type { AttrKey, FormationId, Tireur } from "../data/types";
import { SEGMENT_BY_FORMATION } from "./formations";

/**
 * Effets mécaniques des 24 traits de personnalité (§15) — jusqu'ici purement
 * cosmétiques (aucune référence dans le moteur). Câble chaque ligne du
 * tableau §15 sur le point d'accroche le plus proche déjà identifié :
 * duels d'attributs (match.ts), progression à l'entraînement (training.ts),
 * valeur/résistance au transfert (mercato.ts).
 *
 * Cinq traits restent volontairement sans effet mécanique ici, faute du
 * système qu'ils supposent (moral, indisponibilités, revenu hebdomadaire —
 * aucun n'existe encore dans le moteur) : Vétéran de l'Incident, Formé au
 * Club, Silencieux Redoutable (par conception, §15), Sujet à Rumeurs
 * (fréquence de dépêches, hors scope de la version light des dépêches),
 * et le volet "revenu additionnel" de Symbole du Sponsor (sa prime de
 * valeur marchande, elle, est câblée dans mercato.ts).
 */

export type MatchTraitContext = {
  formation: FormationId;
  period: number; // 1-4
  isCrunch: boolean; // période 4, match serré (écart <= 6 avant cette période)
};

/** Valeur d'attribut d'un tireur pour les besoins d'UN duel de match, traits inclus. */
export function traitAttrValue(t: Tireur, key: AttrKey, ctx: MatchTraitContext): number {
  let v = t.attrs[key];
  const segment = SEGMENT_BY_FORMATION[ctx.formation];

  switch (t.trait) {
    case "oeil-de-foreur":
      if (key === "cavite" && ctx.isCrunch) v += 2;
      break;
    case "mur-d-apnee":
      if (key === "apnee" && ctx.period >= 3) v += 1.5;
      break;
    case "affame-d-anchois":
      if (key === "anchois") v += 1.5;
      if (key === "discipline") v -= 1;
      break;
    case "ami-des-anchois":
      if (key === "anchois" && segment === "ete") v += 1.5;
      break;
    case "coeur-de-printemps":
      if (key === "cavite" || key === "apnee") v += segment === "printemps" ? 1.5 : -0.75;
      break;
    case "loup-d-hiver":
      if ((key === "discipline" || key === "apnee") && segment === "hiver") v += 1.5;
      break;
    case "enfant-de-la-houle":
      if ((key === "souffle" || key === "cavite") && segment === "ete") v += 1.5;
      break;
    case "increvable":
      if (key === "souffle") v += 1;
      break;
    case "poumons-de-la-fosse":
      if (key === "souffle") v += 1.5;
      break;
    case "showman-de-l-anchosiffle":
      if ((key === "cavite" || key === "anchois") && ctx.isCrunch) v += 1;
      break;
    case "timide-du-bassin":
      if ((key === "cavite" || key === "anchois") && ctx.isCrunch) v -= 1;
      break;
    case "sang-froid-du-conseil":
      if (key === "discipline") v += 2;
      break;
    default:
      break;
  }
  return v;
}

/**
 * Ajustement de la "discipline de ciblage" utilisée pour désigner le tireur
 * sanctionné par une saisine (match.ts sélectionne aujourd'hui le tireur à la
 * discipline la plus basse) : plus la valeur retournée est négative, plus le
 * tireur devient une cible probable. Sujet aux Saisines (surtout en Carré-en-
 * cercle/hiver) et Grande Gueule sont plus souvent visés ; Sang-Froid du
 * Conseil, déjà avantagé sur l'attribut lui-même, l'est une seconde fois ici.
 */
export function saisineTargetingBias(t: Tireur, formation: FormationId): number {
  switch (t.trait) {
    case "sujet-aux-saisines":
      return formation === "carre-cercle" ? -6 : -3;
    case "grande-gueule":
      return -2;
    case "sang-froid-du-conseil":
      return 4;
    default:
      return 0;
  }
}

/** Grande Gueule renforce la consigne "provoquer" de son équipe (risque de saisine adverse
 * légèrement accru), au prix d'un risque personnel déjà reflété par saisineTargetingBias. */
export function grandeGueuleTeamRiskBonus(lineup: Tireur[], ownDisciplineIsProvoquer: boolean): number {
  if (!ownDisciplineIsProvoquer) return 0;
  return lineup.some((t) => t.trait === "grande-gueule") ? 0.02 : 0;
}

const PRECOCE_MAX_AGE = 21;

/** Précoce : "potentiel plus élevé" (§15) — progresse plus vite tant qu'il est jeune. */
export function trainingGainMultiplier(t: Tireur): number {
  return t.trait === "precoce" && t.age <= PRECOCE_MAX_AGE ? 1.4 : 1;
}

const OMBRE_MENTORSHIP_MAX_AGE = 23;

/** Ombre du Vestiaire : "accélère la progression des jeunes tireurs alignés à ses côtés" (§15). */
export function ombreDuVestiaireBonus(roster: Tireur[], t: Tireur): number {
  if (t.age > OMBRE_MENTORSHIP_MAX_AGE) return 1;
  return roster.some((mentor) => mentor.trait === "ombre-du-vestiaire" && mentor.id !== t.id) ? 1.3 : 1;
}

/** Increvable / Poumons de la Fosse : "jamais d'indispo essoufflement", fatigue quasi nulle (§15). */
export function fatigueResistanceFactor(t: Tireur): number {
  return t.trait === "increvable" || t.trait === "poumons-de-la-fosse" ? 0.5 : 1;
}

/** Mercenaire / Symbole du Sponsor : "valeur marchande plus élevée" (§15). */
export function traitValueMultiplier(t: Tireur): number {
  if (t.trait === "mercenaire") return 1.15;
  if (t.trait === "symbole-du-sponsor") return 1.1;
  return 1;
}

/** Fidèle au Poste / Capricieux du Bassin : "refuse les offres" — plus dur (et plus cher) à
 * arracher à son club (§15). Se traduit par une surcote demandée plus élevée. */
export function traitStubbornnessMultiplier(t: Tireur): number {
  if (t.trait === "fidele-au-poste" || t.trait === "capricieux-du-bassin") return 1.2;
  return 1;
}
