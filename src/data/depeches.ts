import type { MilestoneKind } from "../engine/match";

/**
 * Dépêches narratives — version light (§14.2/§19). Pas de conséquences
 * mécaniques ni de mémoire multi-tours ici (ça reste un gros chantier de
 * contenu à part entière, cf. plan §35) : uniquement du texte d'ambiance,
 * généré après chaque match à partir des milestones réels et, à l'occasion,
 * d'un résultat surprise ailleurs dans le monde. 1 à 2 par tour maximum.
 */
export type DepecheFamille = "vestiaire" | "gazette" | "bureau" | "mercato";

const MILESTONE_TEMPLATES: Partial<Record<MilestoneKind, string[]>> = {
  comeback: [
    "Le vestiaire de {club} exulte après une remontée héroïque face à {adversaire}.",
    "Personne n'y croyait plus — {club} renverse {adversaire} dans le money-time.",
  ],
  clutch: [
    "Frissons dans le bassin : {club} et {adversaire} se sont séparés à un souffle près.",
    "Un dénouement à couper le souffle entre {club} et {adversaire}.",
  ],
  run: [
    "Série impressionnante pour {club}, jamais inquiété sur plusieurs périodes face à {adversaire}.",
    "{club} a fait la course en tête du début à la fin contre {adversaire}.",
  ],
  lead_change: [
    "Un match à rebondissements entre {club} et {adversaire}, jamais tranquille.",
    "Ambiance électrique : le score a changé de camp plusieurs fois entre {club} et {adversaire}.",
  ],
  equalizer: [
    "{adversaire} est revenu au score contre toute attente face à {club}.",
    "Un scénario totalement rouvert en fin de match entre {club} et {adversaire}.",
  ],
  drought: [
    "Bassin silencieux ce week-end pour {club}, aucune conversion notable face à {adversaire}.",
  ],
};

const SAISINE_TEMPLATES = [
  "Le Conseil a sifflé une saisine lors de {club} - {adversaire} — le vestiaire grommelle.",
  "Nouvelle intervention du Conseil pendant {club} - {adversaire}, la polémique enfle au Bureau.",
];

const UPSET_TEMPLATES = [
  "Sensation ailleurs dans le monde : {petit} corrige {grand} — la Gazette du Bassin s'enflamme.",
  "Le Bureau s'étonne : {petit} a fait chuter {grand} ce tour-ci.",
];

const BUREAU_TEMPLATES = [
  "Le Bureau notifie {club} du passage à la formation-règlement en vigueur pour ce nouveau segment de saison.",
  "Convocation administrative pour {club} : le Bureau rappelle les nouvelles consignes de formation avant le prochain coup d'envoi.",
  "Le Bureau des Entraîneurs publie un rappel de règlement à l'attention de {club} pour ce changement de segment.",
];

const MERCATO_RUMOR_TEMPLATES = [
  "La Gazette évoque un intérêt discret d'un club rival pour l'effectif de {club} en cette fenêtre de mercato.",
  "Fenêtre ouverte : plusieurs agents libres auraient été aperçus en observation autour de {club}.",
  "Rumeur de bordereau : {club} serait sur les rangs pour un renfort avant la fermeture de la fenêtre.",
];

const RETIREMENT_WARNING_TEMPLATES = [
  "{tireur} évoque, entre deux séances, l'idée d'une dernière saison sous ce maillot.",
  "Sans l'annoncer officiellement, {tireur} prépare le vestiaire à une page qui pourrait bientôt se tourner.",
];

function pickTemplate(templates: string[], seed: number): string {
  return templates[seed % templates.length]!;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? key);
}

export function depecheForMilestone(kind: MilestoneKind, club: string, adversaire: string, seed: number): string | null {
  const templates = MILESTONE_TEMPLATES[kind];
  if (!templates) return null;
  return fillTemplate(pickTemplate(templates, seed), { club, adversaire });
}

export function depecheForSaisine(club: string, adversaire: string, seed: number): string {
  return fillTemplate(pickTemplate(SAISINE_TEMPLATES, seed), { club, adversaire });
}

export function depecheForUpset(petit: string, grand: string, seed: number): string {
  return fillTemplate(pickTemplate(UPSET_TEMPLATES, seed), { petit, grand });
}

export function depecheForRetirementWarning(tireur: string, seed: number): string {
  return fillTemplate(pickTemplate(RETIREMENT_WARNING_TEMPLATES, seed), { tireur });
}

export function depecheForBureau(club: string, seed: number): string {
  return fillTemplate(pickTemplate(BUREAU_TEMPLATES, seed), { club });
}

export function depecheForMercatoRumeur(club: string, seed: number): string {
  return fillTemplate(pickTemplate(MERCATO_RUMOR_TEMPLATES, seed), { club });
}
