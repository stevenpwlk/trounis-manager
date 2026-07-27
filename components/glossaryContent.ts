import type { AttrKey, Ciblage, DisciplineConsigne, Tempo } from "../src/data/types";

/**
 * Contenu du Lexique du Bureau (§ demande Steven 2026-07-27 : les 5 attributs et les
 * consignes de match sont illisibles). Chiffres tirés directement du moteur
 * (src/engine/match.ts, tactics.ts, training.ts, formations.ts, mercato.ts) — jamais du
 * flavor text approximatif, pour que le Lexique reste vrai si le moteur change.
 */
export type AttrInfo = {
  roleTag: string;
  summary: string;
  details: string[];
};

export const ATTR_INFO: Record<AttrKey, AttrInfo> = {
  cavite: {
    roleTag: "Attaque",
    summary: "Votre force offensive principale.",
    details: [
      "65% du score d'attaque (le reste vient de l'Anchois).",
      "Poids le plus fort au Triangle — printemps (×1,3) ; le plus faible au Carré-en-cercle — hiver (×0,9).",
      "Passé 15/20, chaque point coûte 3× plus cher à l'entraînement.",
    ],
  },
  apnee: {
    roleTag: "Défense",
    summary: "La seule statistique qui protège votre but.",
    details: [
      "100% de votre défense — rien d'autre ne la complète.",
      "Décisive au Triangle (×1,3) et au Carré-en-cercle (×1,2) ; plus secondaire au Libre — automne (×0,9).",
      "Passé 15/20, chaque point coûte 3× plus cher à l'entraînement.",
    ],
  },
  anchois: {
    roleTag: "Bonus",
    summary: "Complète l'attaque et déclenche des bonus surprise.",
    details: [
      "35% du score d'attaque, plus une chance de +1 point bonus chaque période, qui grandit avec votre moyenne.",
      "Poids le plus fort au Losange — été (×1,4), sa formation de prédilection.",
      "Passé 15/20, chaque point coûte 3× plus cher à l'entraînement.",
    ],
  },
  discipline: {
    roleTag: "Sang-froid",
    summary: "Protège contre les expulsions (saisines du Conseil).",
    details: [
      "Sous 14 de moyenne, le risque de saisine grimpe à chaque période.",
      "Poids le plus fort au Carré-en-cercle — hiver (×1,4), la formation la plus exposée aux saisines.",
      "Passé 15/20, chaque point coûte 3× plus cher à l'entraînement.",
    ],
  },
  souffle: {
    roleTag: "Endurance",
    summary: "Un bonus (ou un boulet) qui grossit à chaque période.",
    details: [
      "Multiplie l'attaque, en bien comme en mal — l'effet est 2× plus fort en période 4 qu'en période 1.",
      "Poids le plus fort au Libre — automne (×1,4), sa formation de prédilection.",
      "Passé 15/20, chaque point coûte 3× plus cher à l'entraînement.",
    ],
  },
};

export const ATTR_MARKET_NOTE =
  "À la revente, les 5 attributs comptent à parts égales dans la valeur d'un tireur — aucun n'a de prime particulière.";

export type ConsigneInfo = { label: string; effect: string };

export const TEMPO_INFO: Record<Tempo, ConsigneInfo> = {
  offensif: { label: "Offensif", effect: "+15% Cavité et Anchois à l'attaque, mais -15% Apnée en défense. Quitte ou double." },
  equilibre: { label: "Équilibré", effect: "Aucun bonus, aucun malus — le réglage neutre." },
  prudent: { label: "Prudent", effect: "+15% Apnée en défense, -15% Cavité à l'attaque. L'Anchois n'est pas touché." },
};

export const CIBLAGE_INFO: Record<Ciblage, ConsigneInfo> = {
  "cibler-apnee": {
    label: "Cibler l'apnée",
    effect: "+10% à l'attaque, mais seulement si l'Apnée moyenne adverse est sous 11 — sinon, aucun effet.",
  },
  "tenir-cavite": {
    label: "Tenir la cavité",
    effect: "Réduit les écarts aléatoires du match de 30% : plus prévisible, moins d'exploits mais moins de catastrophes.",
  },
};

export const DISCIPLINE_CONSIGNE_INFO: Record<DisciplineConsigne, ConsigneInfo> = {
  provoquer: {
    label: "Provoquer",
    effect: "Monte le risque de saisine des deux côtés, mais frappe l'adversaire plus fort (+6 points) que vous (+4 points).",
  },
  "jouer-propre": {
    label: "Jouer propre",
    effect: "Réduit votre propre risque de saisine (-3 points). Aucun effet sur l'adversaire.",
  },
};
