import type { AttrKey, ConditionsBassin, Consignes, FormationId, Tireur } from "../src/data/types";
import { ATTR_KEYS, DEFAULT_CONSIGNES } from "../src/data/types";
import { CLUBS, L1_CODES, L2_CODES, getClub } from "../src/data/clubs";
import { generateClubRoster, generateAttributes } from "../src/data/roster";
import { pickTraitWeighted } from "../src/data/traits";
import { createRng } from "../src/engine/rng";
import { generateDoubleRoundRobin, type Fixture } from "../src/engine/schedule";
import { segmentForJournee, FORMATION_BY_SEASON, isMercatoOpen, isMercatoWindowStart } from "../src/engine/formations";
import { randomConditions } from "../src/engine/bassin";
import { simulateMatch, type MatchResult } from "../src/engine/match";
import { createStandings, applyResult, sortedStandings, type StandingRow } from "../src/engine/standings";
import { evaluateObjective, type ObjectivePalier } from "../src/engine/objective";
import { applyPostMatchFatigue, applyWeeklyRecovery, applyCollectiveSession } from "../src/engine/training";
import { simulateCup, type CupResult } from "../src/engine/cup";
import { tireurValue } from "../src/engine/mercato";
import type { Rng } from "../src/engine/rng";
import {
  depecheForMilestone,
  depecheForSaisine,
  depecheForUpset,
  depecheForRetirementWarning,
  depecheForBureau,
  depecheForMercatoRumeur,
  depecheForAiSwap,
  depecheForHiddenSigning,
  depecheForClosureSigning,
  type DepecheFamille,
} from "../src/data/depeches";
import { generateVivierPool, resolveHiddenSignings, prospectSigningFee, signIntoRoster, type Prospect } from "../src/data/vivier";

/**
 * Orchestration d'UNE saison jouable en solo (P2, §34) : le joueur dirige un
 * seul club, les 19 autres sont simulés en IA (auto-composition + consignes
 * par défaut, cf. §21). Pas de persistance multi-saison, pas de Vivier/
 * mercato IA (P3) — le mercato du joueur reste possible (agents libres +
 * offres simples, §8) mais les autres clubs ne "vivent" pas leur mercato ici.
 */

export type PendingStep = "training" | "lineup" | "match" | "post-match" | "season-end";

export type BarrageReport = {
  home: string;
  away: string;
  result: MatchResult;
  winner: string;
  involvesPlayer: boolean;
};

export type CupReport = {
  champion: string;
  playerReached: string; // nom du dernier tour atteint par le club du joueur ("Non qualifié" si absent du tirage)
  playerEliminatedBy: string | null; // code club, null si le joueur a gagné la Coupe ou n'a pas participé
};

export type Depeche = { id: string; journee: number; family: DepecheFamille; text: string };

export type SeasonReport = {
  finalRank: number;
  standing: StandingRow;
  objectivePalier: ObjectivePalier;
  wonTitle: boolean;
  barrage: BarrageReport; // toujours joué (8e L1 vs 3e L2), quel que soit le club du joueur
  promotion: "monte" | "descend" | "maintien"; // sort du club du joueur pour l'affichage (sans effet en P2, pas de saison suivante)
  cup: CupReport;
};

export type GameState = {
  worldName: string;
  seed: string;
  season: number; // 1, 2, 3... incrémenté à chaque startNextSeason (continuité multi-saison)
  clubCode: string;
  league: "L1" | "L2";
  budget: number;
  budgets: Record<string, number>; // budget de CHAQUE club (§8/§21, étape D) — ledger simple, pas de salaires/recettes (cf. future étape J)
  journee: number; // 1..18 ; 19 = saison terminée
  rosters: Record<string, Tireur[]>;
  fixtures: Fixture[]; // calendrier complet de la ligue du joueur
  otherFixtures: Fixture[]; // calendrier de l'AUTRE ligue, simulée en fond (jamais jouée par le joueur) — nécessaire pour le barrage et la Coupe en fin de saison
  standings: Record<"L1" | "L2", StandingRow[]>; // classement courant (recalculé à chaque journée jouée)
  playedResults: Array<{ journee: number; home: string; away: string; result: MatchResult }>;
  otherPlayedResults: Array<{ journee: number; home: string; away: string; result: MatchResult }>;
  depeches: Depeche[]; // fil d'actualités léger (§14.2/§19) — les plus récentes en tête
  trainingDoneThisJournee: boolean;
  restedTireurId: string | null;
  lastMatchResult: MatchResult | null;
  lastMatchOpponent: string | null;
  seasonReport: SeasonReport | null;
  vivierPool: Prospect[] | null; // non-null pendant l'intersaison (§14.5/§23), jusqu'à validation par le joueur
};

function otherLeagueCodes(league: "L1" | "L2"): string[] {
  return league === "L1" ? L1_CODES : L2_CODES;
}

export function createNewGame(worldName: string, clubCode: string, seed: string): GameState {
  const rng = createRng(seed);
  const club = getClub(clubCode);
  const rosters: Record<string, Tireur[]> = {};
  for (const c of CLUBS) rosters[c.code] = generateClubRoster(c.code, rng);
  const budgets: Record<string, number> = {};
  for (const c of CLUBS) budgets[c.code] = c.budget;

  const leagueCodes = otherLeagueCodes(club.league);
  const fixtures = generateDoubleRoundRobin(leagueCodes);
  const otherLeagueCode = club.league === "L1" ? "L2" : "L1";
  const otherFixtures = generateDoubleRoundRobin(otherLeagueCodes(otherLeagueCode));
  const standings = {
    L1: sortedStandings(createStandings(L1_CODES)),
    L2: sortedStandings(createStandings(L2_CODES)),
  };

  const state: GameState = {
    worldName,
    seed,
    season: 1,
    clubCode,
    league: club.league,
    budget: club.budget,
    budgets,
    journee: 1,
    rosters,
    fixtures,
    otherFixtures,
    standings,
    playedResults: [],
    otherPlayedResults: [],
    depeches: [],
    trainingDoneThisJournee: false,
    restedTireurId: null,
    lastMatchResult: null,
    lastMatchOpponent: null,
    seasonReport: null,
    vivierPool: null,
  };
  return simulateAiMercatoForJournee(state);
}

export function currentFixture(state: GameState): Fixture | null {
  if (state.journee > 18) return null;
  return state.fixtures.find((f) => f.journee === state.journee && (f.home === state.clubCode || f.away === state.clubCode)) ?? null;
}

export function currentFormation(state: GameState): FormationId {
  return FORMATION_BY_SEASON[segmentForJournee(state.journee)];
}

export function currentBassin(state: GameState): ConditionsBassin {
  return randomConditions(createRng(`${state.seed}-bassin-${state.journee}`));
}

/**
 * Simule tous les matchs d'une journée SAUF celui du joueur (qui sera joué
 * interactivement via MatchSession dans l'écran de live). Applique la
 * fatigue post-match aux tireurs alignés des clubs IA.
 */
export function simulateAiMatchesForJournee(state: GameState, journee: number): GameState {
  const rng = createRng(`${state.seed}-ai-${journee}`);
  const formation = FORMATION_BY_SEASON[segmentForJournee(journee)];
  const fixturesThisJournee = state.fixtures.filter((f) => f.journee === journee);
  const league = state.league === "L1" ? "L1" : "L2";
  // Les codes viennent de state.standings (composition RÉELLE de la saison en cours), pas des
  // constantes statiques L1_CODES/L2_CODES — celles-ci ne reflètent que la répartition d'origine
  // et cassent dès qu'une saison suivante a redistribué des clubs entre ligues (étape A).
  const standingsTable = createStandings(state.standings[league].map((r) => r.code));
  // reconstruit le classement courant à partir des résultats déjà joués (y compris le futur match du joueur, ajouté séparément)
  for (const played of state.playedResults) {
    applyResult(standingsTable, played.home, played.away, played.result);
  }

  const playedResults = [...state.playedResults];
  for (const fixture of fixturesThisJournee) {
    if (fixture.home === state.clubCode || fixture.away === state.clubCode) continue; // joué séparément
    const conditions = randomConditions(rng);
    const result = simulateMatch({
      homeRoster: state.rosters[fixture.home]!,
      awayRoster: state.rosters[fixture.away]!,
      formation,
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions,
      rng,
    });
    applyResult(standingsTable, fixture.home, fixture.away, result);
    playedResults.push({ journee, home: fixture.home, away: fixture.away, result });
  }

  return {
    ...state,
    playedResults,
    standings: { ...state.standings, [league]: sortedStandings(standingsTable) },
  };
}

/**
 * Simule 100% en fond la journée de l'AUTRE ligue (celle où joue le club du joueur) :
 * nécessaire pour connaître un classement complet des deux ligues en fin de saison
 * (barrage 8e L1 / 3e L2, Coupe inter-ligues §28). Aucune interaction du joueur ici.
 */
export function simulateOtherLeagueJournee(state: GameState, journee: number): GameState {
  const otherLeague = state.league === "L1" ? "L2" : "L1";
  const rng = createRng(`${state.seed}-ai-other-${journee}`);
  const formation = FORMATION_BY_SEASON[segmentForJournee(journee)];
  const fixturesThisJournee = state.otherFixtures.filter((f) => f.journee === journee);
  // Idem simulateAiMatchesForJournee : composition réelle de la saison, pas les constantes statiques.
  const standingsTable = createStandings(state.standings[otherLeague].map((r) => r.code));
  for (const played of state.otherPlayedResults) {
    applyResult(standingsTable, played.home, played.away, played.result);
  }

  const otherPlayedResults = [...state.otherPlayedResults];
  for (const fixture of fixturesThisJournee) {
    const conditions = randomConditions(rng);
    const result = simulateMatch({
      homeRoster: state.rosters[fixture.home]!,
      awayRoster: state.rosters[fixture.away]!,
      formation,
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions,
      rng,
    });
    applyResult(standingsTable, fixture.home, fixture.away, result);
    otherPlayedResults.push({ journee, home: fixture.home, away: fixture.away, result });
  }

  return {
    ...state,
    otherPlayedResults,
    standings: { ...state.standings, [otherLeague]: sortedStandings(standingsTable) },
  };
}

function weakestAttr(roster: Tireur[]): AttrKey {
  let weakest: AttrKey = ATTR_KEYS[0]!;
  let weakestAvg = Infinity;
  for (const k of ATTR_KEYS) {
    const avg = roster.reduce((sum, t) => sum + t.attrs[k], 0) / roster.length;
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakest = k;
    }
  }
  return weakest;
}

/**
 * IA plus vivante (§29, "Le Bureau ne triche jamais... séance collective toujours sur
 * l'attribut le plus faible") : chaque club IA (tous sauf celui du joueur) progresse un
 * peu chaque journée, comme le fait le joueur via son propre entraînement. Sans quoi les
 * 19 autres clubs restent figés toute la saison pendant que le joueur seul s'améliore.
 * Le mercato IA reste hors scope ici (P3) — sans écran de scouting adverse en P2, des
 * transferts IA-IA seraient invisibles au joueur.
 */
export function applyAiWeeklyTraining(state: GameState): GameState {
  const rosters = { ...state.rosters };
  for (const c of CLUBS) {
    if (c.code === state.clubCode) continue;
    const nextRoster = rosters[c.code]!.map((t) => ({ ...t, attrs: { ...t.attrs } }));
    applyCollectiveSession(nextRoster, weakestAttr(nextRoster));
    rosters[c.code] = nextRoster;
  }
  return { ...state, rosters };
}

/** Auto-réparation pour les sauvegardes créées avant l'étape D (champ absent au runtime
 * malgré le typage, puisque loadCloudSlot fait un simple cast du JSON stocké). */
function ensureBudgets(budgets: Record<string, number> | undefined): Record<string, number> {
  if (budgets && CLUBS.every((c) => typeof budgets[c.code] === "number")) return budgets;
  const fresh: Record<string, number> = {};
  for (const c of CLUBS) fresh[c.code] = budgets?.[c.code] ?? c.budget;
  return fresh;
}

const MAX_AI_TRANSFERS_PER_WINDOW = 2;

/**
 * Mercato IA entre les 19 autres clubs (§8/§21, étape D) : aux ouvertures de fenêtre
 * uniquement (isMercatoWindowStart), 1-2 mouvements max, jamais le club du joueur (ni
 * comme acheteur ni comme vendeur — les offres reçues sur ses propres tireurs recoupent
 * le système de dépêches à choix/conséquences complet, hors scope ici cf. étape F), et
 * jamais de star (même exclusion que MercatoScreen côté joueur).
 *
 * Modèle d'ÉCHANGE plutôt que d'achat sec : tous les clubs démarrent (et restent, via le
 * remplacement 1:1 des retraites) à l'exact plafond de 10 — un pur achat exigerait une
 * place libre qui n'existe jamais. Le club acheteur cède donc un de ses propres tireurs
 * en retour, avec une soulte en Anchois d'Or si l'écart de valeur le justifie ; les deux
 * effectifs restent à taille constante, jamais au-delà du plafond. Ledger simple
 * (state.budgets) : pas de salaires ni de recettes de match — la vraie économie complète
 * reste une étape à part (future étape J).
 */
export function simulateAiMercatoForJournee(state: GameState): GameState {
  if (!isMercatoWindowStart(state.journee)) return state;
  const rng = createRng(`${state.seed}-ai-mercato-${state.journee}`);
  const eligible = CLUBS.filter((c) => c.code !== state.clubCode);

  let rosters = state.rosters;
  let budgets = ensureBudgets(state.budgets);
  const depeches: Depeche[] = [];

  for (let i = 0; i < MAX_AI_TRANSFERS_PER_WINDOW; i++) {
    const avgBudget = eligible.reduce((sum, c) => sum + budgets[c.code]!, 0) / eligible.length;
    const buyerCandidates = eligible.filter((c) => budgets[c.code]! > avgBudget && rosters[c.code]!.some((t) => !t.isStar));
    if (buyerCandidates.length === 0) break;
    const buyer = rng.pick(buyerCandidates);

    const sellerCandidates = eligible.filter((c) => c.code !== buyer.code && rosters[c.code]!.some((t) => !t.isStar));
    if (sellerCandidates.length === 0) break;
    const seller = rng.pick(sellerCandidates);

    const target = rng.pick(rosters[seller.code]!.filter((t) => !t.isStar)); // le tireur convoité
    const given = rng.pick(rosters[buyer.code]!.filter((t) => !t.isStar)); // cédé en retour, effectifs inchangés en taille
    const cash = Math.max(0, tireurValue(target) - tireurValue(given));
    if (budgets[buyer.code]! < cash) continue;

    rosters = {
      ...rosters,
      [seller.code]: [...rosters[seller.code]!.filter((t) => t.id !== target.id), { ...given, clubCode: seller.code }],
      [buyer.code]: [...rosters[buyer.code]!.filter((t) => t.id !== given.id), { ...target, clubCode: buyer.code }],
    };
    budgets = { ...budgets, [buyer.code]: budgets[buyer.code]! - cash, [seller.code]: budgets[seller.code]! + cash };
    depeches.push({
      id: `${state.journee}-ai-transfer-${i}`,
      journee: state.journee,
      family: "mercato",
      text: depecheForAiSwap(target.name, given.name, seller.name, buyer.name, state.journee + i),
    });
  }

  if (depeches.length === 0) return { ...state, budgets };
  return { ...state, rosters, budgets, depeches: [...depeches, ...state.depeches].slice(0, MAX_DEPECHES) };
}

const UPSET_FORCE_GAP = 15;
const MAX_DEPECHES = 40;

/**
 * Dépêches narratives — version light (§14.2/§19) : pas de conséquences mécaniques ni de
 * mémoire multi-tours ici, juste du texte d'ambiance généré à partir des milestones réels
 * du match du joueur et, à l'occasion, d'un résultat surprise ailleurs dans le monde.
 * 1 à 2 dépêches par tour maximum, à appeler juste avant advanceJournee.
 */
/** Le segment qui commence à cette journée précisément (nouvelle formation-règlement), ou null. */
function segmentStartingAt(journee: number): boolean {
  if (journee <= 1) return true;
  return segmentForJournee(journee) !== segmentForJournee(journee - 1);
}

export function generateDepechesForJournee(state: GameState, playerResult: MatchResult, opponentCode: string): Depeche[] {
  const depeches: Depeche[] = [];
  const clubName = getClub(state.clubCode).name;
  const opponentName = getClub(opponentCode).name;

  for (const milestone of playerResult.milestones) {
    const text = depecheForMilestone(milestone, clubName, opponentName, state.journee);
    if (text) depeches.push({ id: `${state.journee}-m-${milestone}`, journee: state.journee, family: "vestiaire", text });
  }
  if (playerResult.saisines.length > 0) {
    depeches.push({ id: `${state.journee}-saisine`, journee: state.journee, family: "vestiaire", text: depecheForSaisine(clubName, opponentName, state.journee) });
  }

  // Bureau de la F.I.S.T. : pousse davantage aux changements de segment de saison (§26) —
  // nouvelle formation-règlement, moment naturel pour une convocation administrative.
  if (segmentStartingAt(state.journee)) {
    depeches.push({ id: `${state.journee}-bureau`, journee: state.journee, family: "bureau", text: depecheForBureau(clubName, state.journee) });
  }

  // Mercato & rumeurs : concentré sur les fenêtres ouvertes, quasi nul hors fenêtre (§8/§26).
  if (isMercatoOpen(state.journee)) {
    depeches.push({ id: `${state.journee}-mercato`, journee: state.journee, family: "mercato", text: depecheForMercatoRumeur(clubName, state.journee) });
  }

  // Un résultat surprise ailleurs dans le monde (hors le match du joueur), au plus une par tour.
  const elsewhere = [...state.playedResults, ...state.otherPlayedResults].filter(
    (r) => r.journee === state.journee && r.home !== state.clubCode && r.away !== state.clubCode
  );
  for (const { home, away, result } of elsewhere) {
    const homeWon = result.homeScore > result.awayScore;
    const winnerForce = getClub(homeWon ? home : away).forceLore;
    const loserForce = getClub(homeWon ? away : home).forceLore;
    if (loserForce - winnerForce >= UPSET_FORCE_GAP) {
      const petit = getClub(homeWon ? home : away).name;
      const grand = getClub(homeWon ? away : home).name;
      depeches.push({ id: `${state.journee}-upset-${home}-${away}`, journee: state.journee, family: "gazette", text: depecheForUpset(petit, grand, state.journee) });
      break;
    }
  }

  return depeches.slice(0, 2);
}

/** À appeler une fois le match du joueur terminé : enregistre le résultat au classement. */
export function recordPlayerMatch(state: GameState, home: string, away: string, result: MatchResult): GameState {
  const league = state.league;
  // Idem simulateAiMatchesForJournee : composition réelle de la saison, pas les constantes statiques.
  const table = createStandings(state.standings[league].map((r) => r.code));
  const playedResults = [...state.playedResults, { journee: state.journee, home, away, result }];
  for (const played of playedResults) {
    if (played.journee <= state.journee) applyResult(table, played.home, played.away, played.result);
  }
  return { ...state, playedResults, standings: { ...state.standings, [league]: sortedStandings(table) } };
}

/** Avance à la journée suivante (ou termine la saison après la 18e). */
export function advanceJournee(state: GameState): GameState {
  const next = state.journee + 1;
  if (next > 18) {
    return finalizeSeason({ ...state, journee: next });
  }
  return { ...state, journee: next, trainingDoneThisJournee: false, restedTireurId: null, lastMatchResult: null, lastMatchOpponent: null };
}

/** Construit, pour chaque club, l'ensemble des adversaires affrontés en championnat lors des 2 dernières journées (règle anti-redite de la Coupe, §28). */
function buildRecentOpponents(state: GameState): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const recentJournees = new Set([17, 18]);
  for (const { journee, home, away } of [...state.playedResults, ...state.otherPlayedResults]) {
    if (!recentJournees.has(journee)) continue;
    if (!map.has(home)) map.set(home, new Set());
    if (!map.has(away)) map.set(away, new Set());
    map.get(home)!.add(away);
    map.get(away)!.add(home);
  }
  return map;
}

/** Barrage (§9) : 8e de L1 contre 3e de L2, match sec. Toujours joué, quel que soit le club du joueur. */
function computeBarrage(state: GameState, rng: Rng): BarrageReport {
  const eighthL1 = state.standings.L1[7]!.code;
  const thirdL2 = state.standings.L2[2]!.code;
  const result = simulateMatch({
    homeRoster: state.rosters[eighthL1]!,
    awayRoster: state.rosters[thirdL2]!,
    formation: "carre-cercle",
    homeConsignes: DEFAULT_CONSIGNES,
    awayConsignes: DEFAULT_CONSIGNES,
    conditions: randomConditions(rng),
    rng,
  });
  const winner = result.homeScore >= result.awayScore ? eighthL1 : thirdL2;
  return { home: eighthL1, away: thirdL2, result, winner, involvesPlayer: state.clubCode === eighthL1 || state.clubCode === thirdL2 };
}

/** Sort du club du joueur (§9) : purement informatif en P2 (pas de saison suivante à faire vivre). */
function computePromotionStatus(state: GameState, barrage: BarrageReport): "monte" | "descend" | "maintien" {
  const club = state.clubCode;
  if (state.league === "L1") {
    const rank = state.standings.L1.findIndex((r) => r.code === club) + 1;
    if (rank >= 9) return "descend";
    if (rank === 8) return barrage.winner === club ? "maintien" : "descend";
    return "maintien";
  }
  const rank = state.standings.L2.findIndex((r) => r.code === club) + 1;
  if (rank <= 2) return "monte";
  if (rank === 3) return (barrage.winner === club ? "monte" : "maintien");
  return "maintien";
}

/** Coupe de la F.I.S.T. (§28) : simulée en un bloc en fin de saison sur les classements finaux (simplification assumée par le moteur, cf. cup.ts). */
function computeCupReport(state: GameState, rng: Rng): CupReport {
  const recentOpponents = buildRecentOpponents(state);
  const rostersMap = new Map(Object.entries(state.rosters));
  // journee vaut déjà 19 ici (finalizeSeason est appelé après l'incrément) : la Coupe se joue
  // avec la formation-règlement de la dernière journée réelle (18, hiver/carré-en-cercle).
  const cupResult: CupResult = simulateCup(state.standings.L1, state.standings.L2, rostersMap, recentOpponents, rng, FORMATION_BY_SEASON[segmentForJournee(18)]);

  const club = state.clubCode;
  let playerReached = "Non qualifié";
  let playerEliminatedBy: string | null = null;
  for (const round of cupResult.rounds) {
    const tie = round.ties.find((t) => t.home === club || t.away === club);
    if (!tie) continue;
    playerReached = round.name;
    if (tie.winner !== club) {
      playerEliminatedBy = tie.home === club ? tie.away : tie.home;
      break;
    }
  }
  if (cupResult.champion === club) {
    playerReached = "Vainqueur";
    playerEliminatedBy = null;
  }
  return { champion: cupResult.champion, playerReached, playerEliminatedBy };
}

function finalizeSeason(state: GameState): GameState {
  const table = state.standings[state.league];
  const rankIdx = table.findIndex((r) => r.code === state.clubCode);
  const finalRank = rankIdx + 1;
  const club = getClub(state.clubCode);
  const wonTitle = finalRank === 1;
  const palier = evaluateObjective({ finalRank, targetRank: club.targetRank, wonTitle });

  const rng = createRng(`${state.seed}-playoffs`);
  const barrage = computeBarrage(state, rng);
  const promotion = computePromotionStatus(state, barrage);
  const cup = computeCupReport(state, rng);

  return {
    ...state,
    seasonReport: {
      finalRank,
      standing: table[rankIdx]!,
      objectivePalier: palier,
      wonTitle,
      barrage,
      promotion,
      cup,
    },
  };
}

/**
 * Redistribution complète des 20 clubs entre L1/L2 pour la saison suivante (§9) : généralise
 * à tout le monde la règle déjà appliquée au seul club du joueur par computePromotionStatus
 * (2 montées/2 descentes directes + barrage). Nécessaire pour reconstruire un calendrier
 * cohérent à la reprise (startNextSeason) — computePromotionStatus reste inchangée, elle sert
 * uniquement à l'affichage du bilan du joueur.
 */
function computeLeagueReshuffle(state: GameState, barrage: BarrageReport): { l1: string[]; l2: string[] } {
  const l1Table = state.standings.L1;
  const l2Table = state.standings.L2;
  const l1Stay = l1Table.slice(0, 7).map((r) => r.code); // rangs 1-7 : maintien direct
  const eighthL1 = l1Table[7]!.code;
  const l1Relegated = l1Table.slice(8, 10).map((r) => r.code); // rangs 9-10 : descente directe
  const l2Promoted = l2Table.slice(0, 2).map((r) => r.code); // rangs 1-2 : montée directe
  const thirdL2 = l2Table[2]!.code;
  const l2Stay = l2Table.slice(3, 10).map((r) => r.code); // rangs 4-10 : maintien direct

  const eighthL1Stays = barrage.winner === eighthL1;
  return {
    l1: [...l1Stay, eighthL1Stays ? eighthL1 : thirdL2, ...l2Promoted],
    l2: [...l1Relegated, eighthL1Stays ? thirdL2 : eighthL1, ...l2Stay],
  };
}

const RETIREMENT_FORCED_AGE = 36; // borne haute §6 ("Âge 18-36")
const RETIREMENT_PROBABLE_FROM = 33; // probabilité croissante avant la borne forcée (préavis flou, §38)

/**
 * Vieillit tout le monde d'un an à la transition de saison et gère la retraite (§6/§38).
 * Retraite minimale/placeholder (pas encore le vrai Vivier, §23/étape C) : un tireur qui part
 * est remplacé au même id/poste par un jeune (18-20 ans) généré à neuf, même pattern que
 * generateClubRoster. Ne retourne les noms des tireurs du joueur qui viennent d'entrer dans la
 * zone à risque (34-35 ans, pas encore partis) que pour prévenir via une dépêche Vestiaire.
 */
function applyAgingAndRetirement(
  rosters: Record<string, Tireur[]>,
  rng: Rng,
  playerClubCode: string
): { rosters: Record<string, Tireur[]>; retirementWarnings: string[] } {
  const nextRosters: Record<string, Tireur[]> = {};
  const retirementWarnings: string[] = [];
  for (const club of CLUBS) {
    const roster = rosters[club.code]!;
    nextRosters[club.code] = roster.map((t) => {
      const age = t.age + 1;
      const retireChance =
        age >= RETIREMENT_FORCED_AGE ? 1 : age >= RETIREMENT_PROBABLE_FROM ? (age - RETIREMENT_PROBABLE_FROM + 1) * 0.25 : 0;
      if (retireChance > 0 && rng.chance(retireChance)) {
        return {
          id: t.id,
          name: t.name,
          clubCode: club.code,
          age: rng.int(18, 20),
          attrs: generateAttributes(club, rng),
          trait: pickTraitWeighted(rng),
          isStar: false,
          forme: 100,
        } satisfies Tireur;
      }
      if (club.code === playerClubCode && (age === 34 || age === 35)) {
        retirementWarnings.push(t.name);
      }
      return { ...t, age, forme: 100 }; // repos d'intersaison (§9 "temps fort"), avant la reprise
    });
  }
  return { rosters: nextRosters, retirementWarnings };
}

/**
 * Fait passer le monde à la saison suivante (§9 "jeu sans fin fixe", §10) : jusqu'ici
 * SeasonEnd était un cul-de-sac (P2.5). Reconduit effectif (vieilli)/budget/dépêches,
 * reconstruit ligues/calendrier/classements à zéro. Ne peut être appelée qu'après
 * finalizeSeason (state.seasonReport doit être renseigné).
 */
export function startNextSeason(state: GameState): GameState {
  if (!state.seasonReport) throw new Error("startNextSeason: aucune saison terminée à clôturer");
  const season = state.season + 1;
  const seed = `${state.seed}-s${season}`;
  const rng = createRng(`${seed}-transition`);

  const { l1, l2 } = computeLeagueReshuffle(state, state.seasonReport.barrage);
  const league: "L1" | "L2" = l1.includes(state.clubCode) ? "L1" : "L2";

  const { rosters, retirementWarnings } = applyAgingAndRetirement(state.rosters, rng, state.clubCode);

  const playerCodes = league === "L1" ? l1 : l2;
  const otherCodes = league === "L1" ? l2 : l1;
  const fixtures = generateDoubleRoundRobin(playerCodes);
  const otherFixtures = generateDoubleRoundRobin(otherCodes);
  const standings = { L1: sortedStandings(createStandings(l1)), L2: sortedStandings(createStandings(l2)) };

  const retirementDepeches: Depeche[] = retirementWarnings.map((name, i) => ({
    id: `s${season}-retirement-${i}`,
    journee: 1,
    family: "vestiaire",
    text: depecheForRetirementWarning(name, season * 7 + i),
  }));

  const activeNames = new Set(Object.values(rosters).flat().map((t) => t.name));
  const rawVivierPool = generateVivierPool(createRng(`${seed}-vivier`), activeNames, state.clubCode);
  const hidden = resolveHiddenSignings(rawVivierPool, rosters, ensureBudgets(state.budgets));
  const hiddenDepeches: Depeche[] = hidden.signings.map((s, i) => ({
    id: `s${season}-vivier-hidden-${i}`,
    journee: 1,
    family: "mercato",
    text: depecheForHiddenSigning(s.prospectName, getClub(s.clubCode).name, season * 5 + i),
  }));

  const transitional: GameState = {
    ...state,
    season,
    seed,
    league,
    journee: 1,
    rosters: hidden.rosters,
    budgets: hidden.budgets,
    fixtures,
    otherFixtures,
    standings,
    playedResults: [],
    otherPlayedResults: [],
    depeches: [...hiddenDepeches, ...retirementDepeches, ...state.depeches].slice(0, MAX_DEPECHES),
    trainingDoneThisJournee: false,
    restedTireurId: null,
    lastMatchResult: null,
    lastMatchOpponent: null,
    seasonReport: null,
    vivierPool: hidden.pool,
  };
  // Fenêtre 1 (journée 1) : l'IA fait aussi ses mouvements à la reprise de la saison.
  return simulateAiMercatoForJournee(transitional);
}

/**
 * Résout la concurrence IA sur les prospects repérés que le joueur n'a pas recrutés
 * (étape D, ferme la boucle d'"urgence réelle" du §23) : à appeler quand le joueur
 * valide l'écran du Vivier ("Continuer"), à la place d'un simple vivierPool: null.
 */
export function resolveVivierClosure(state: GameState): GameState {
  const pool = state.vivierPool ?? [];
  let rosters = state.rosters;
  let budgets = ensureBudgets(state.budgets);
  const depeches: Depeche[] = [];
  let i = 0;

  for (const p of pool) {
    if (!p.interestClubCode) continue;
    const clubCode = p.interestClubCode;
    const fee = prospectSigningFee(p);
    if (budgets[clubCode]! < fee) continue;
    const signed: Tireur = { id: `${clubCode}-vivier-${p.id}`, name: p.name, clubCode, age: p.age, attrs: { ...p.attrs }, trait: p.trait, isStar: false, forme: 100 };
    rosters = { ...rosters, [clubCode]: signIntoRoster(rosters[clubCode]!, signed) };
    budgets = { ...budgets, [clubCode]: budgets[clubCode]! - fee };
    depeches.push({
      id: `vivier-closure-${state.season}-${i}`,
      journee: state.journee,
      family: "mercato",
      text: depecheForClosureSigning(p.name, getClub(clubCode).name, state.journee + i),
    });
    i++;
  }

  return {
    ...state,
    rosters,
    budgets,
    vivierPool: null,
    depeches: [...depeches, ...state.depeches].slice(0, MAX_DEPECHES),
  };
}

/** Applique la fatigue post-match + la récupération hebdomadaire au club du joueur. */
export function applyWeeklyConditioning(roster: Tireur[], playedLineup: Tireur[], restedId: string | null, seed: string): void {
  const rng = createRng(seed);
  applyPostMatchFatigue(playedLineup, rng);
  applyWeeklyRecovery(
    roster.filter((t) => !playedLineup.some((p) => p.id === t.id)),
    restedId
  );
}

