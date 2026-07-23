import type { FormationId, TraitId } from "../src/data/types";

/** Libellés affichés des 24 traits (plan §15). */
export const TRAIT_LABELS: Record<TraitId, string> = {
  "oeil-de-foreur": "Œil de Foreur",
  "mur-d-apnee": "Mur d'Apnée",
  "affame-d-anchois": "Affamé d'Anchois",
  "sang-froid-du-conseil": "Sang-Froid du Conseil",
  "poumons-de-la-fosse": "Poumons de la Fosse",
  "sujet-aux-saisines": "Sujet aux Saisines",
  "ami-des-anchois": "Ami des Anchois",
  "veteran-de-l-incident": "Vétéran de l'Incident",
  "coeur-de-printemps": "Cœur de Printemps",
  "loup-d-hiver": "Loup d'Hiver",
  "enfant-de-la-houle": "Enfant de la Houle",
  precoce: "Précoce",
  increvable: "Increvable",
  "capricieux-du-bassin": "Capricieux du Bassin",
  "fidele-au-poste": "Fidèle au Poste",
  mercenaire: "Mercenaire",
  "showman-de-l-anchosiffle": "Showman de l'Anchosiffle",
  "timide-du-bassin": "Timide du Bassin",
  "forme-au-club": "Formé au Club",
  "ombre-du-vestiaire": "Ombre du Vestiaire",
  "grande-gueule": "Grande Gueule",
  "silencieux-redoutable": "Silencieux Redoutable",
  "sujet-a-rumeurs": "Sujet à Rumeurs",
  "symbole-du-sponsor": "Symbole du Sponsor",
};

export const ATTR_LABELS: Record<string, string> = {
  cavite: "Cavité",
  apnee: "Apnée",
  anchois: "Anchois",
  discipline: "Discipline",
  souffle: "Souffle",
};

/** Libellés affichés des 4 formations-règlement (plan §5). */
export const FORMATION_LABELS: Record<FormationId, string> = {
  triangle: "Triangle",
  losange: "Losange",
  libre: "Libre",
  "carre-cercle": "Carré-en-cercle",
};

/** Libellés affichés des niveaux de conditions de bassin (identifiants internes sans accent). */
export const BASSIN_LABELS: Record<string, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  moyen: "Moyen",
  elevee: "Élevée",
  eleve: "Élevé",
};
