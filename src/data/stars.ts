import type { Attributes, TraitId } from "./types";

/** Les 16 stars canoniques (plan §17), clé = "CLUB:Nom". */
export type StarSpec = {
  club: string;
  name: string;
  age: number;
  attrs: Attributes;
  trait: TraitId;
  surnom: string;
};

export const STARS: StarSpec[] = [
  { club: "GOU", name: "Alain Térieur", age: 29, attrs: { cavite: 18, apnee: 14, anchois: 10, discipline: 16, souffle: 12 }, trait: "oeil-de-foreur", surnom: "le Métronome" },
  { club: "GOU", name: "Alex Térieur", age: 24, attrs: { cavite: 16, apnee: 12, anchois: 13, discipline: 14, souffle: 15 }, trait: "precoce", surnom: "la Relève" },
  { club: "MAK", name: "Maki Yage", age: 27, attrs: { cavite: 15, apnee: 13, anchois: 19, discipline: 11, souffle: 14 }, trait: "affame-d-anchois", surnom: "le Glouton" },
  { club: "MAK", name: "Hana Conda", age: 31, attrs: { cavite: 14, apnee: 17, anchois: 15, discipline: 13, souffle: 11 }, trait: "ombre-du-vestiaire", surnom: "la Grande Sœur" },
  { club: "NJO", name: "Sven Touse", age: 28, attrs: { cavite: 13, apnee: 17, anchois: 11, discipline: 15, souffle: 18 }, trait: "poumons-de-la-fosse", surnom: "le Courant" },
  { club: "NJO", name: "Finn Aliste", age: 33, attrs: { cavite: 11, apnee: 18, anchois: 9, discipline: 17, souffle: 13 }, trait: "sang-froid-du-conseil", surnom: "le Glacier" },
  { club: "SIL", name: "Anne Dulation", age: 26, attrs: { cavite: 17, apnee: 13, anchois: 14, discipline: 12, souffle: 14 }, trait: "enfant-de-la-houle", surnom: "la Sinueuse" },
  { club: "SIL", name: "Flo Taison", age: 30, attrs: { cavite: 16, apnee: 15, anchois: 10, discipline: 13, souffle: 16 }, trait: "showman-de-l-anchosiffle", surnom: "l'Artiste" },
  { club: "CCG", name: "Heidi Pothermie", age: 29, attrs: { cavite: 14, apnee: 16, anchois: 10, discipline: 18, souffle: 13 }, trait: "mur-d-apnee", surnom: "le Coffre-Fort" },
  { club: "PAP", name: "Pál Prika", age: 27, attrs: { cavite: 16, apnee: 11, anchois: 15, discipline: 10, souffle: 14 }, trait: "grande-gueule", surnom: "la Braise" },
  { club: "ABR", name: "Alain Chovy", age: 25, attrs: { cavite: 12, apnee: 14, anchois: 18, discipline: 13, souffle: 15 }, trait: "fidele-au-poste", surnom: "l'Ancre" },
  { club: "SAL", name: "Sal Vador", age: 32, attrs: { cavite: 11, apnee: 16, anchois: 12, discipline: 14, souffle: 17 }, trait: "increvable", surnom: "le Sel" },
  { club: "KRA", name: "Per Iscope", age: 28, attrs: { cavite: 13, apnee: 15, anchois: 11, discipline: 15, souffle: 13 }, trait: "loup-d-hiver", surnom: "le Kraken" },
  { club: "HOU", name: "Maureen Haute", age: 24, attrs: { cavite: 14, apnee: 12, anchois: 13, discipline: 12, souffle: 16 }, trait: "enfant-de-la-houle", surnom: "le Ressac" },
  { club: "CAV", name: "María Nade", age: 30, attrs: { cavite: 17, apnee: 10, anchois: 14, discipline: 11, souffle: 13 }, trait: "showman-de-l-anchosiffle", surnom: "el Tridente" },
  { club: "APS", name: "Halène Delair", age: 33, attrs: { cavite: 10, apnee: 19, anchois: 9, discipline: 15, souffle: 14 }, trait: "fidele-au-poste", surnom: "la Digue" },
];

export function findStar(club: string, name: string): StarSpec | undefined {
  return STARS.find((s) => s.club === club && s.name === name);
}
