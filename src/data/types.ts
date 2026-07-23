/** Types partagés du moteur — cf. plan de conception §5, §6, §9, §16. */

export type AttrKey = "cavite" | "apnee" | "anchois" | "discipline" | "souffle";

export type Attributes = Record<AttrKey, number>; // chaque valeur ~1-20

export const ATTR_KEYS: readonly AttrKey[] = ["cavite", "apnee", "anchois", "discipline", "souffle"];

export type League = "L1" | "L2";

export type Club = {
  code: string;
  name: string;
  country: string;
  league: League;
  forceLore: number; // ~45-92, cf. plan §18
  budget: number; // Anchois d'Or de départ, cf. plan §18
  /** Biais de profil d'attributs (terroir), cf. plan §14.5. Somme informelle, pas normalisée à 1. */
  terroir: Partial<Record<AttrKey, number>>;
};

export type TraitId =
  | "oeil-de-foreur"
  | "mur-d-apnee"
  | "affame-d-anchois"
  | "sang-froid-du-conseil"
  | "poumons-de-la-fosse"
  | "sujet-aux-saisines"
  | "ami-des-anchois"
  | "veteran-de-l-incident"
  | "coeur-de-printemps"
  | "loup-d-hiver"
  | "enfant-de-la-houle"
  | "precoce"
  | "increvable"
  | "capricieux-du-bassin"
  | "fidele-au-poste"
  | "mercenaire"
  | "showman-de-l-anchosiffle"
  | "timide-du-bassin"
  | "forme-au-club"
  | "ombre-du-vestiaire"
  | "grande-gueule"
  | "silencieux-redoutable"
  | "sujet-a-rumeurs"
  | "symbole-du-sponsor";

export type Tireur = {
  id: string;
  name: string;
  clubCode: string;
  age: number;
  attrs: Attributes;
  trait: TraitId;
  isStar: boolean;
  surnom?: string;
  /** Forme (0-100) : état passager, cf. plan §6. Pas simulée en P1 (pas de calendrier d'entraînement). */
  forme: number;
};

export type FormationId = "triangle" | "losange" | "libre" | "carre-cercle";

export type SeasonSegment = "printemps" | "ete" | "automne" | "hiver";

export type Tempo = "prudent" | "equilibre" | "offensif";
export type Ciblage = "cibler-apnee" | "tenir-cavite";
export type DisciplineConsigne = "provoquer" | "jouer-propre";

export type Consignes = {
  tempo: Tempo;
  ciblage: Ciblage;
  discipline: DisciplineConsigne;
};

export const DEFAULT_CONSIGNES: Consignes = {
  tempo: "equilibre",
  ciblage: "tenir-cavite",
  discipline: "jouer-propre",
};

export type SaliniteNiveau = "faible" | "moyenne" | "elevee";
export type PaprikaNiveau = "faible" | "moyen" | "eleve";
export type RisqueMarinNiveau = "faible" | "moyen" | "eleve";

export type ConditionsBassin = {
  salinite: SaliniteNiveau;
  paprika: PaprikaNiveau;
  risqueMarin: RisqueMarinNiveau;
};
