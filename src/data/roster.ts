import type { Attributes, AttrKey, Club, Tireur } from "./types";
import { ATTR_KEYS } from "./types";
import { getClub } from "./clubs";
import { ROSTER_NAMES } from "./roster-names";
import { findStar } from "./stars";
import { pickTraitWeighted } from "./traits";
import type { Rng } from "../engine/rng";

/**
 * Génère les 10 tireurs d'un club. Les stars canoniques (§17) reprennent
 * leurs attributs/trait/surnom exacts ; les autres sont générés (§14.5,
 * §33) : niveau moyen dérivé de la force lore du club, biais de terroir,
 * bruit aléatoire, borné [4,20] (plancher pro).
 */
export function generateClubRoster(clubCode: string, rng: Rng): Tireur[] {
  const club = getClub(clubCode);
  const slots = ROSTER_NAMES[clubCode];
  if (!slots) throw new Error(`Pas de noms de tireurs pour le club ${clubCode}`);

  return slots.map((slot, index) => {
    const id = `${clubCode}-${index}`;
    if (slot.star) {
      const star = findStar(clubCode, slot.name);
      if (!star) throw new Error(`Star marquée mais introuvable: ${clubCode}:${slot.name}`);
      return {
        id,
        name: star.name,
        clubCode,
        age: star.age,
        attrs: { ...star.attrs },
        trait: star.trait,
        isStar: true,
        surnom: star.surnom,
        forme: 100,
      } satisfies Tireur;
    }
    return {
      id,
      name: slot.name,
      clubCode,
      age: generateAge(rng),
      attrs: generateAttributes(club, rng),
      trait: pickTraitWeighted(rng),
      isStar: false,
      forme: 70 + rng.int(0, 30),
    } satisfies Tireur;
  });
}

function generateAge(rng: Rng): number {
  // moyenne de deux tirages uniformes [18,34] -> distribution resserrée sur 22-30
  const a = rng.int(18, 34);
  const b = rng.int(18, 34);
  return Math.round((a + b) / 2);
}

/**
 * Chaque tireur a 1-2 spécialités individuelles (attributs boostés), pas
 * seulement un biais d'équipe plat — c'est ce qui donne à l'auto-sélection
 * de composition (pickLineup, §21) de vraies options différentes selon la
 * formation en vigueur, et rend concret le principe §5 (« un effectif ne
 * peut pas être bon toute l'année »). Les spécialités penchent vers le
 * terroir du club (identité collective, §14.5) sans y être limitées
 * (diversité individuelle : même un club "cavité" a quelques spécialistes
 * apnée ou souffle dans l'effectif).
 */
function pickSpecialties(club: Club, rng: Rng, count: number): AttrKey[] {
  const terroirKeys = Object.keys(club.terroir) as AttrKey[];
  const result: AttrKey[] = [];
  let guard = 0;
  while (result.length < count && guard++ < 20) {
    const candidate = terroirKeys.length > 0 && rng.chance(0.5) ? rng.pick(terroirKeys) : rng.pick(ATTR_KEYS);
    if (!result.includes(candidate)) result.push(candidate);
  }
  return result;
}

function generateAttributes(club: Club, rng: Rng): Attributes {
  // force 45 -> moyenne ~8 ; force 92 -> moyenne ~15.5 (échelle 1-20)
  const baseAvg = 8 + ((club.forceLore - 45) / 47) * 7.5;
  const specialtyCount = rng.chance(0.55) ? 1 : 2;
  const specialties = pickSpecialties(club, rng, specialtyCount);
  const attrs = {} as Attributes;
  for (const key of ATTR_KEYS) {
    const terroirBonus = club.terroir[key] ?? 0;
    const isSpecialty = specialties.includes(key);
    const specialtyBoost = isSpecialty ? 3 + rng.int(0, 2) : 0;
    const raw = baseAvg + terroirBonus * 0.5 + specialtyBoost + rng.noise(isSpecialty ? 2 : 3);
    attrs[key] = clamp(Math.round(raw), 4, 20);
  }
  return attrs;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function averageAttr(tireurs: Tireur[], key: AttrKey): number {
  if (tireurs.length === 0) return 0;
  return tireurs.reduce((sum, t) => sum + t.attrs[key], 0) / tireurs.length;
}
