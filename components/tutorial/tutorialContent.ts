/**
 * Contenu du tutoriel contextuel (demande Steven du 2026-07-27 : le jeu
 * n'explique rien à l'ouverture). Chaque "moment" apparaît une seule fois,
 * déclenché par GameApp quand l'écran correspondant est atteint pour la
 * première fois — jamais un mur de texte unique au lancement.
 */
export type TutorialMomentId = "bienvenue" | "entrainement" | "composition" | "match" | "mercato" | "fin-saison";

export type TutorialDiagram = "formations" | "momentum";

export type TutorialMoment = {
  id: TutorialMomentId;
  eyebrow: string;
  title: string;
  body: string[];
  /** Valeur de `data-tutorial-target` du bouton réel à mettre en surbrillance, le cas échéant. */
  target?: string;
  diagram?: TutorialDiagram;
  offerSkipAll?: boolean;
};

export const TUTORIAL_MOMENT_ORDER: TutorialMomentId[] = [
  "bienvenue",
  "entrainement",
  "composition",
  "match",
  "mercato",
  "fin-saison",
];

export const TUTORIAL_MOMENTS: Record<TutorialMomentId, TutorialMoment> = {
  bienvenue: {
    id: "bienvenue",
    eyebrow: "Note de service du Bureau",
    title: "Bienvenue, Manager Homologué",
    body: [
      "Une saison compte 18 journées : chaque semaine, un entraînement, une composition, un match — et parfois du mercato.",
      "Le Bureau vous guidera à chaque nouvelle étape. Vous pourrez tout revoir depuis l'onglet Plus.",
    ],
    offerSkipAll: true,
  },
  entrainement: {
    id: "entrainement",
    eyebrow: "Note de service du Bureau",
    title: "L'entraînement de la semaine",
    body: [
      "Une séance collective (tout l'effectif) et un travail spécifique (un seul tireur) : à vous de choisir l'attribut à travailler.",
      "Pas envie de trancher ? « Laisser le Bureau décider » s'en charge — mais jamais aussi bien que vous.",
    ],
    target: "training-validate",
  },
  composition: {
    id: "composition",
    eyebrow: "Note de service du Bureau",
    title: "Formation-règlement & consignes",
    body: [
      "La formation change au fil de la saison : elle impose le nombre de tireurs alignés, jamais votre choix des hommes.",
      "Réglez tempo, ciblage et discipline, puis lancez le match.",
    ],
    diagram: "formations",
    target: "lineup-launch",
  },
  match: {
    id: "match",
    eyebrow: "Note de service du Bureau",
    title: "Le match, période par période",
    body: [
      "Le momentum peut basculer d'un camp à l'autre, surtout en fin de match.",
      "Une discipline trop faible expose aux saisines du Conseil ; l'anchois peut, à l'occasion, faire pencher la balance.",
      "Pressé ? « Simuler la fin » saute directement au résultat.",
    ],
    diagram: "momentum",
  },
  mercato: {
    id: "mercato",
    eyebrow: "Note de service du Bureau",
    title: "Le mercato et l'Anchois d'Or",
    body: [
      "Deux fenêtres par saison (début et mi-saison) : proposez une offre, le club adverse accepte, contre-offre, ou refuse.",
      "Toute transaction se paie en Anchois d'Or (Ⱥ), la trésorerie de votre club.",
    ],
    target: "mercato-offer",
  },
  "fin-saison": {
    id: "fin-saison",
    eyebrow: "Note de service du Bureau",
    title: "Bilan de saison",
    body: [
      "Votre club est jugé sur un palier — Échec, Conforme ou Exploit — selon l'objectif de direction fixé en début de saison.",
      "Ligue, barrage et Coupe se jouent en parallèle. À l'intersaison, le Vivier fait émerger de nouveaux espoirs à recruter.",
    ],
  },
};
