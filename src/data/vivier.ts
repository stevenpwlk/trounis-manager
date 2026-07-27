import type { Attributes, TraitId } from "./types";
import { ATTR_KEYS } from "./types";
import { CLUBS } from "./clubs";
import { ROSTER_NAMES } from "./roster-names";
import { generateAttributes } from "./roster";
import { pickTraitWeighted } from "./traits";
import { tireurValue } from "../engine/mercato";
import type { Rng } from "../engine/rng";

/**
 * Le Vivier annuel (§14.5/§23) : à chaque intersaison, un lot de jeunes espoirs
 * (18-20 ans) apparaît, remplacement naturel des retraités. Potentiel
 * volontairement flou — seule zone de fog-of-war du jeu (§37) : un
 * `potentialCeiling` interne existe mais n'est jamais affiché tel quel,
 * uniquement traduit en libellé qualitatif (potentialLabel).
 */
export type Prospect = {
  id: string;
  name: string;
  age: number;
  originClubCode: string;
  attrs: Attributes;
  trait: TraitId;
  potentialCeiling: number; // 1-20, jamais affiché brut
  scouted: boolean;
  spotted: boolean; // fait partie des quelques profils "repérés" visibles d'emblée (§23)
  interestClubCode: string | null; // concurrence visible, purement narratif tant que le mercato IA (étape D) n'existe pas
};

const POOL_SIZE = 24;
const SPOTTED_COUNT = 6;
export const SCOUT_COST = 40;

const PROSPECT_NAME_POOL = Object.values(ROSTER_NAMES)
  .flat()
  .filter((slot) => !slot.star)
  .map((slot) => slot.name);

function attrAvg(attrs: Attributes): number {
  return ATTR_KEYS.reduce((sum, k) => sum + attrs[k], 0) / ATTR_KEYS.length;
}

export function generateVivierPool(rng: Rng, activeNames: ReadonlySet<string>): Prospect[] {
  const availableNames = PROSPECT_NAME_POOL.filter((name) => !activeNames.has(name));
  const pool: Prospect[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const originClub = rng.pick(CLUBS);
    const nameIdx = rng.int(0, availableNames.length - 1);
    const name = availableNames.splice(nameIdx, 1)[0]!;
    const attrs = generateAttributes(originClub, rng);
    const upside = rng.int(1, 7);
    const potentialCeiling = Math.max(8, Math.min(19, Math.round(attrAvg(attrs) + upside)));
    const others = CLUBS.filter((c) => c.code !== originClub.code);
    pool.push({
      id: `prospect-${i}-${originClub.code}`,
      name,
      age: rng.int(18, 20),
      originClubCode: originClub.code,
      attrs,
      trait: pickTraitWeighted(rng),
      potentialCeiling,
      scouted: false,
      spotted: i < SPOTTED_COUNT,
      interestClubCode: rng.chance(0.4) ? rng.pick(others).code : null,
    });
  }
  return pool;
}

/** Libellé qualitatif du potentiel — jamais un chiffre (§23). Plus précis une fois scouté. */
export function potentialLabel(p: Prospect): string {
  if (!p.scouted) {
    if (p.potentialCeiling >= 16) return "Pourrait devenir un pilier";
    if (p.potentialCeiling >= 12) return "Profil intrigant";
    return "Pari incertain";
  }
  const gap = p.potentialCeiling - attrAvg(p.attrs);
  if (p.potentialCeiling >= 16 && gap <= 3) return "Déjà solide, plafond élevé";
  if (p.potentialCeiling >= 16) return "Diamant brut, marge de progression énorme";
  if (p.potentialCeiling >= 12) return "Bon complément, vraie marge de progression";
  return "Rôle limité, misez ailleurs";
}

/** Prix de recrutement — réutilise l'économie du mercato existant (les jeunes non-stars
 * y sont déjà sous-valorisés par l'âge, cohérent avec "le potentiel ne se chiffre pas"). */
export function prospectSigningFee(p: Prospect): number {
  return tireurValue({
    id: p.id,
    name: p.name,
    clubCode: p.originClubCode,
    age: p.age,
    attrs: p.attrs,
    trait: p.trait,
    isStar: false,
    forme: 100,
  });
}
