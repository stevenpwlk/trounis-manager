import type { Attributes, Consignes } from "../data/types";

/**
 * Delta multiplicatif des consignes tactiques sur la note d'attaque/défense
 * (§16). Appliqué en plus des poids de formation. `own` = propre équipe,
 * `saisineRiskDelta` = ajustement additif du risque de saisine (points de %).
 */
export type TacticsEffect = {
  attackMult: Partial<Record<keyof Attributes, number>>;
  defenseMult: Partial<Record<keyof Attributes, number>>;
  ownSaisineRiskDelta: number;
  oppSaisineRiskDelta: number;
  /** Réduit le bruit du tirage de score (Tenir la cavité = plancher plus sûr). */
  varianceMult: number;
};

export function tacticsEffect(consignes: Consignes): TacticsEffect {
  const effect: TacticsEffect = {
    attackMult: {},
    defenseMult: {},
    ownSaisineRiskDelta: 0,
    oppSaisineRiskDelta: 0,
    varianceMult: 1,
  };

  if (consignes.tempo === "offensif") {
    effect.attackMult.cavite = (effect.attackMult.cavite ?? 1) * 1.15;
    effect.attackMult.anchois = (effect.attackMult.anchois ?? 1) * 1.15;
    effect.defenseMult.apnee = (effect.defenseMult.apnee ?? 1) * 0.85;
  } else if (consignes.tempo === "prudent") {
    effect.defenseMult.apnee = (effect.defenseMult.apnee ?? 1) * 1.15;
    effect.attackMult.cavite = (effect.attackMult.cavite ?? 1) * 0.85;
  }

  if (consignes.ciblage === "tenir-cavite") {
    effect.varianceMult *= 0.7;
  }
  // "cibler-apnee" : bonus appliqué au moment du calcul du duel (dépend de
  // l'apnée adverse), géré directement dans match.ts.

  if (consignes.discipline === "provoquer") {
    effect.oppSaisineRiskDelta += 0.06;
    effect.ownSaisineRiskDelta += 0.04;
  } else {
    effect.ownSaisineRiskDelta -= 0.03;
  }

  return effect;
}
