import type { Attributes, Tireur, TraitId } from "./types";
import { ATTR_KEYS } from "./types";
import { CLUBS } from "./clubs";
import { ROSTER_NAMES } from "./roster-names";
import { RESERVE_NAMES } from "./reserve-names";
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

const PROSPECT_NAME_POOL = [
  ...Object.values(ROSTER_NAMES)
    .flat()
    .filter((slot) => !slot.star)
    .map((slot) => slot.name),
  ...Object.values(RESERVE_NAMES).flat(),
];

function attrAvg(attrs: Attributes): number {
  return ATTR_KEYS.reduce((sum, k) => sum + attrs[k], 0) / ATTR_KEYS.length;
}

/**
 * Ajoute un tireur signé à un effectif IA déjà au plafond de 10 (le cas courant — la
 * génération d'effectif et le remplacement des retraites maintiennent tout le monde à
 * 10 en permanence, cf. étape D) en libérant son non-star le plus faible plutôt que de
 * bloquer la signature. Un jeune espoir qui arrive pousse un joueur de fond de banc vers
 * la sortie — cohérent avec un effectif qui se renouvelle.
 */
export function signIntoRoster(roster: Tireur[], signed: Tireur): Tireur[] {
  if (roster.length < 10) return [...roster, signed];
  const nonStars = roster.filter((t) => !t.isStar);
  if (nonStars.length === 0) return roster; // aucun remplacement possible (effectif 100% stars, improbable)
  const weakest = [...nonStars].sort((a, b) => attrAvg(a.attrs) - attrAvg(b.attrs))[0]!;
  return [...roster.filter((t) => t.id !== weakest.id), signed];
}

export function generateVivierPool(rng: Rng, activeNames: ReadonlySet<string>, playerClubCode: string): Prospect[] {
  const availableNames = PROSPECT_NAME_POOL.filter((name) => !activeNames.has(name));
  const pool: Prospect[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const originClub = rng.pick(CLUBS);
    // Réserve de noms encore libres épuisée (effectifs pleins un peu partout au fil des
    // saisons, cf. étape D) : on retombe sur le catalogue complet plutôt que de laisser un
    // prospect sans nom — un nom partagé avec un tireur actif ailleurs est déjà toléré par
    // le lore (§33, ex. Njordifles/Fjordström Malmö).
    const name = availableNames.length > 0 ? availableNames.splice(rng.int(0, availableNames.length - 1), 1)[0]! : rng.pick(PROSPECT_NAME_POOL);
    const attrs = generateAttributes(originClub, rng);
    const upside = rng.int(1, 7);
    const potentialCeiling = Math.max(8, Math.min(19, Math.round(attrAvg(attrs) + upside)));
    // Le club du joueur n'est jamais un rival "intéressé" — cette concurrence ne concerne que l'IA (étape D).
    const rivals = CLUBS.filter((c) => c.code !== originClub.code && c.code !== playerClubCode);
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
      interestClubCode: rng.chance(0.4) ? rng.pick(rivals).code : null,
    });
  }
  return pool;
}

/**
 * Signatures IA invisibles (§23 : "les autres existent mais ne sont visibles que si un
 * autre club les recrute en premier") — résolu juste après la génération du pool, avant
 * même que le joueur ne voie l'écran du Vivier. Seuls les prospects NON repérés sont
 * concernés : les repérés restent visibles quoi qu'il arrive, leur résolution (étape D)
 * se fait plus tard, à la fermeture de l'écran (cf. resolveVivierClosure, lib/game.ts).
 */
export function resolveHiddenSignings(
  pool: Prospect[],
  rosters: Record<string, Tireur[]>,
  budgets: Record<string, number>
): { pool: Prospect[]; rosters: Record<string, Tireur[]>; budgets: Record<string, number>; signings: Array<{ prospectName: string; clubCode: string }> } {
  let nextRosters = rosters;
  let nextBudgets = budgets;
  const signings: Array<{ prospectName: string; clubCode: string }> = [];
  const visiblePool: Prospect[] = [];

  for (const p of pool) {
    if (p.spotted || !p.interestClubCode) {
      visiblePool.push(p);
      continue;
    }
    const clubCode = p.interestClubCode;
    const fee = prospectSigningFee(p);
    if (nextBudgets[clubCode]! < fee) {
      visiblePool.push(p);
      continue;
    }
    const signed: Tireur = { id: `${clubCode}-vivier-${p.id}`, name: p.name, clubCode, age: p.age, attrs: { ...p.attrs }, trait: p.trait, isStar: false, forme: 100 };
    nextRosters = { ...nextRosters, [clubCode]: signIntoRoster(nextRosters[clubCode]!, signed) };
    nextBudgets = { ...nextBudgets, [clubCode]: nextBudgets[clubCode]! - fee };
    signings.push({ prospectName: p.name, clubCode });
  }

  return { pool: visiblePool, rosters: nextRosters, budgets: nextBudgets, signings };
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
