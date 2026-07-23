export type ObjectivePalier = "echec" | "conforme" | "exploit";

/**
 * Évalue la saison d'un club contre son objectif de direction (§20) : 3
 * paliers déterminés par la marge entre le rang final et le rang cible.
 * Un trophée (titre de ligue ou Coupe) est toujours au moins un Exploit,
 * quel que soit le rang visé.
 */
export function evaluateObjective(params: { finalRank: number; targetRank: number; wonTitle?: boolean; wonCup?: boolean }): ObjectivePalier {
  if (params.wonTitle || params.wonCup) return "exploit";

  const margin = params.targetRank - params.finalRank; // positif si mieux que l'objectif
  if (margin >= 3) return "exploit";
  if (margin >= -2) return "conforme";
  return "echec";
}
