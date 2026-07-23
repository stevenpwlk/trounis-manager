import type { ConditionsBassin } from "../data/types";
import type { Rng } from "./rng";

export type BassinEffect = {
  apneeMult: number;
  caviteMult: number;
  anchoisMult: number;
  disciplineMult: number;
  /** Probabilité par période d'un twist "déflecteur" borné (§14.1-e / §28-adjacent). */
  deflectorChance: number;
};

export function bassinEffect(conditions: ConditionsBassin): BassinEffect {
  const effect: BassinEffect = {
    apneeMult: 1,
    caviteMult: 1,
    anchoisMult: 1,
    disciplineMult: 1,
    deflectorChance: 0,
  };

  if (conditions.salinite === "elevee") effect.apneeMult *= 1.15;
  else if (conditions.salinite === "faible") effect.apneeMult *= 0.95;

  if (conditions.paprika === "eleve") {
    effect.caviteMult *= 0.85;
    effect.anchoisMult *= 1.1;
  } else if (conditions.paprika === "moyen") {
    effect.anchoisMult *= 1.03;
  }

  if (conditions.risqueMarin === "eleve") {
    effect.deflectorChance = 0.12;
    effect.disciplineMult *= 1.1;
  } else if (conditions.risqueMarin === "moyen") {
    effect.deflectorChance = 0.05;
  }

  return effect;
}

const SALINITE_LEVELS: ConditionsBassin["salinite"][] = ["faible", "moyenne", "elevee"];
const PAPRIKA_LEVELS: ConditionsBassin["paprika"][] = ["faible", "moyen", "eleve"];
const RISQUE_LEVELS: ConditionsBassin["risqueMarin"][] = ["faible", "moyen", "eleve"];

export function randomConditions(rng: Rng): ConditionsBassin {
  return {
    salinite: rng.pick(SALINITE_LEVELS),
    paprika: rng.pick(PAPRIKA_LEVELS),
    risqueMarin: rng.pick(RISQUE_LEVELS),
  };
}
