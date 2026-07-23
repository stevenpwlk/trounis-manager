import type { TraitId } from "./types";

export type Rarity = "commun" | "peu-commun" | "rare" | "legendaire";

export type TraitSpec = {
  id: TraitId;
  rarity: Rarity;
};

/** Les 24 traits du plan §15. Poids de tirage : commun ~55%, peu commun ~30%,
 * rare ~12%, légendaire ~3% (réservé en pratique aux stars/exceptions —
 * exclu du tirage procédural ici, cf. §15). */
export const TRAITS: TraitSpec[] = [
  { id: "affame-d-anchois", rarity: "commun" },
  { id: "sujet-aux-saisines", rarity: "commun" },
  { id: "ami-des-anchois", rarity: "commun" },
  { id: "coeur-de-printemps", rarity: "commun" },
  { id: "loup-d-hiver", rarity: "commun" },
  { id: "enfant-de-la-houle", rarity: "commun" },
  { id: "precoce", rarity: "commun" },
  { id: "timide-du-bassin", rarity: "commun" },
  { id: "forme-au-club", rarity: "commun" },
  { id: "grande-gueule", rarity: "commun" },
  { id: "silencieux-redoutable", rarity: "commun" },
  { id: "sujet-a-rumeurs", rarity: "commun" },

  { id: "oeil-de-foreur", rarity: "peu-commun" },
  { id: "mur-d-apnee", rarity: "peu-commun" },
  { id: "sang-froid-du-conseil", rarity: "peu-commun" },
  { id: "increvable", rarity: "peu-commun" },
  { id: "fidele-au-poste", rarity: "peu-commun" },
  { id: "mercenaire", rarity: "peu-commun" },
  { id: "showman-de-l-anchosiffle", rarity: "peu-commun" },
  { id: "ombre-du-vestiaire", rarity: "peu-commun" },
  { id: "symbole-du-sponsor", rarity: "peu-commun" },

  { id: "poumons-de-la-fosse", rarity: "rare" },
  { id: "capricieux-du-bassin", rarity: "rare" },

  { id: "veteran-de-l-incident", rarity: "legendaire" },
];

const RARITY_WEIGHT: Record<Rarity, number> = {
  commun: 55,
  "peu-commun": 30,
  rare: 12,
  legendaire: 3,
};

/** Tirage pondéré, en excluant les traits légendaires (réservés, cf. §15). */
export function pickTraitWeighted(rng: { next(): number }): TraitId {
  const pool = TRAITS.filter((t) => t.rarity !== "legendaire");
  const total = pool.reduce((sum, t) => sum + RARITY_WEIGHT[t.rarity], 0);
  let roll = rng.next() * total;
  for (const t of pool) {
    roll -= RARITY_WEIGHT[t.rarity];
    if (roll <= 0) return t.id;
  }
  return pool[pool.length - 1]!.id;
}
