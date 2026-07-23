import type { Club } from "./types";

/**
 * Les 20 clubs — forces lore, budgets et objectifs du plan §18 (§9 pour la
 * répartition L1/L2). Terroir = biais d'attributs dérivé du lore (§14.5),
 * utilisé par le générateur d'effectif (src/data/roster.ts) : valeurs
 * additives informelles, pas normalisées. `targetRank` dérive le texte
 * d'objectif (§18) en rang cible 1-10 exploitable par l'évaluateur §20.
 */
export const CLUBS: Club[] = [
  { code: "GOU", name: "Goudufist", country: "France", league: "L1", forceLore: 92, budget: 1100, terroir: { cavite: 2, discipline: 1 }, objectiveText: "Le titre, rien d'autre.", targetRank: 1 },
  { code: "NJO", name: "Njordifles", country: "Scandinavie", league: "L1", forceLore: 88, budget: 1000, terroir: { apnee: 2, souffle: 1 }, objectiveText: "Le titre est à portée, ne plus finir 2e.", targetRank: 1 },
  { code: "SIL", name: "Sillon", country: "France", league: "L1", forceLore: 87, budget: 980, terroir: { cavite: 1, souffle: 1 }, objectiveText: "Venger la finale, ramener le titre à la maison.", targetRank: 1 },
  { code: "MAK", name: "Makitouffe", country: "Japon", league: "L1", forceLore: 90, budget: 1050, terroir: { anchois: 2, cavite: 1 }, objectiveText: "Conserver la couronne mondiale, viser le doublé Ligue + Coupe.", targetRank: 1 },
  { code: "CCG", name: "Cavité Club Genève", country: "Suisse", league: "L1", forceLore: 80, budget: 850, terroir: { apnee: 2, discipline: 1 }, objectiveText: "Viser le podium et un beau parcours en Coupe.", targetRank: 3 },
  { code: "PAP", name: "Paprika United", country: "Hongrie", league: "L1", forceLore: 78, budget: 800, terroir: { anchois: 1, cavite: 1 }, objectiveText: "S'installer durablement dans le top 5.", targetRank: 5 },
  { code: "ABR", name: "Anchois Brestois", country: "France", league: "L1", forceLore: 77, budget: 780, terroir: { anchois: 2, apnee: 1 }, objectiveText: "Confirmer la bonne saison passée, viser le top 6.", targetRank: 6 },
  { code: "SAL", name: "Salinité SC", country: "Portugal", league: "L1", forceLore: 75, budget: 720, terroir: { apnee: 1, souffle: 1 }, objectiveText: "Assurer un maintien sans trembler.", targetRank: 8 },
  { code: "KRA", name: "Kraken d'Oslo", country: "Norvège", league: "L1", forceLore: 74, budget: 700, terroir: { discipline: 2, apnee: 1 }, objectiveText: "Maintien, et sortir un match référence en hiver.", targetRank: 8 },
  { code: "HOU", name: "La Houle FC", country: "France", league: "L1", forceLore: 73, budget: 650, terroir: { souffle: 1, cavite: 1 }, objectiveText: "Éviter le barrage, viser la 8e place ou mieux.", targetRank: 8 },
  { code: "CAV", name: "Cavitadors de Veracruz", country: "Mexique", league: "L2", forceLore: 72, budget: 600, terroir: { cavite: 2, anchois: 1 }, objectiveText: "Monter directement en Ligue 1.", targetRank: 2 },
  { code: "APS", name: "Apnée Serein", country: "Suisse", league: "L2", forceLore: 70, budget: 580, terroir: { apnee: 2, discipline: 1 }, objectiveText: "Monter en Ligue 1, mettre fin à l'exil en L2.", targetRank: 2 },
  { code: "FJO", name: "Fjordström Malmö", country: "Suède", league: "L2", forceLore: 68, budget: 540, terroir: { apnee: 1, souffle: 1 }, objectiveText: "Jouer le haut de tableau, viser le barrage.", targetRank: 3 },
  { code: "VOR", name: "Vortex Bilbao", country: "Espagne", league: "L2", forceLore: 65, budget: 500, terroir: { souffle: 1, discipline: 1 }, objectiveText: "Finir dans le top 6, se donner une chance.", targetRank: 6 },
  { code: "ATL", name: "Atlantes Porto", country: "Portugal", league: "L2", forceLore: 62, budget: 470, terroir: { cavite: 1, discipline: 1 }, objectiveText: "Stabiliser le club en milieu de tableau.", targetRank: 6 },
  { code: "COR", name: "Corallium Split", country: "Croatie", league: "L2", forceLore: 59, budget: 440, terroir: { anchois: 1, souffle: 1 }, objectiveText: "Assurer le maintien en L2.", targetRank: 8 },
  { code: "POS", name: "Poséidon Athina", country: "Grèce", league: "L2", forceLore: 56, budget: 410, terroir: { cavite: 1, discipline: 1 }, objectiveText: "Éviter la zone rouge.", targetRank: 8 },
  { code: "WAV", name: "Wavebreak Dublin", country: "Irlande", league: "L2", forceLore: 52, budget: 380, terroir: { souffle: 1, apnee: 1 }, objectiveText: "Ne pas finir dans les 2 derniers.", targetRank: 8 },
  { code: "NAP", name: "Cavité Napoli", country: "Italie", league: "L2", forceLore: 49, budget: 350, terroir: { cavite: 1, anchois: 1 }, objectiveText: "Survivre à la saison, un point est une victoire.", targetRank: 9 },
  { code: "ALB", name: "Anchois Albion", country: "R.-U.", league: "L2", forceLore: 45, budget: 300, terroir: { anchois: 1, apnee: 1 }, objectiveText: "Le vrai mode difficile : gagner plus d'un match sur trois serait déjà un exploit.", targetRank: 10 },
];

export function getClub(code: string): Club {
  const club = CLUBS.find((c) => c.code === code);
  if (!club) throw new Error(`Club inconnu: ${code}`);
  return club;
}

export const L1_CODES = CLUBS.filter((c) => c.league === "L1").map((c) => c.code);
export const L2_CODES = CLUBS.filter((c) => c.league === "L2").map((c) => c.code);
