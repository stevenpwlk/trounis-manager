import type { Consignes, ConditionsBassin, Tireur } from "../data/types";
import { DEFAULT_CONSIGNES } from "../data/types";
import { FORMATION_WEIGHTS } from "./formations";
import { tacticsEffect } from "./tactics";
import { bassinEffect } from "./bassin";
import type { MatchTraitContext } from "./traits-effects";
import { weightedAvg, saisineChance, CIBLAGE_APNEE_THRESHOLD, type TeamContext } from "./match";

/**
 * Aperçus "avant validation" pour les écrans de décision (composition, mi-temps/temps mort,
 * demande Steven 2026-07-27 : voir l'effet des consignes avant de choisir). Recompose les
 * VRAIES formules du moteur (match.ts/tactics.ts/formations.ts/bassin.ts) plutôt que d'en
 * dupliquer une version approximative côté écran — un schéma qui mentirait sur le calcul
 * réel serait pire que pas de schéma du tout.
 */

export type TempoImpact = { cavite: number; apnee: number; anchois: number };

/** Cavité/Apnée/Anchois "effectifs" pour une composition donnée, avec les consignes appliquées —
 * mêmes sous-expressions que teamOffense()/teamDefense() dans match.ts, avant leur combinaison
 * finale (qui n'a de sens qu'en un seul score, pas par attribut). */
export function previewTempoImpact(lineup: Tireur[], consignes: Consignes, bassinConditions: ConditionsBassin, ctx: MatchTraitContext): TempoImpact {
  const w = FORMATION_WEIGHTS[ctx.formation];
  const tactics = tacticsEffect(consignes);
  const bassin = bassinEffect(bassinConditions);
  return {
    cavite: weightedAvg(lineup, "cavite", ctx) * w.cavite * (tactics.attackMult.cavite ?? 1) * bassin.caviteMult,
    apnee: weightedAvg(lineup, "apnee", ctx) * w.apnee * (tactics.defenseMult.apnee ?? 1) * bassin.apneeMult,
    anchois: weightedAvg(lineup, "anchois", ctx) * w.anchois * (tactics.attackMult.anchois ?? 1) * bassin.anchoisMult,
  };
}

/** L'apnée adverse au sens strict du moteur (match.ts) : moyenne brute, ni traits ni bassin —
 * "Cibler l'apnée" compare exactement cette valeur au seuil, rien d'autre. */
export function previewCiblage(opponentLineup: Tireur[]): { opponentApnee: number; willTrigger: boolean } {
  const opponentApnee = weightedAvg(opponentLineup, "apnee");
  return { opponentApnee, willTrigger: opponentApnee < CIBLAGE_APNEE_THRESHOLD };
}

/** Risque de saisine (vous vs l'adversaire) pour la période à venir — l'IA adverse joue
 * toujours en consignes par défaut (DEFAULT_CONSIGNES) sur les matchs de saison, donc son
 * risque ne dépend que de votre éventuel "Provoquer", jamais l'inverse. */
export function previewSaisineRisk(
  ownLineup: Tireur[],
  opponentLineup: Tireur[],
  consignes: Consignes,
  bassinConditions: ConditionsBassin,
  ctx: MatchTraitContext
): { ownRisk: number; opponentRisk: number } {
  const bassin = bassinEffect(bassinConditions);
  const ownTeam: TeamContext = { side: "home", roster: ownLineup, lineup: ownLineup, consignes, tactics: tacticsEffect(consignes) };
  const opponentTeam: TeamContext = {
    side: "away",
    roster: opponentLineup,
    lineup: opponentLineup,
    consignes: DEFAULT_CONSIGNES,
    tactics: tacticsEffect(DEFAULT_CONSIGNES),
  };
  const ownRisk = saisineChance(ownTeam, ctx.formation, bassin, false, ctx);
  const opponentRisk = saisineChance(opponentTeam, ctx.formation, bassin, consignes.discipline === "provoquer", ctx);
  return { ownRisk, opponentRisk };
}
