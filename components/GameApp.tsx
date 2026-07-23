"use client";
import { useEffect, useState } from "react";
import Onboarding from "./screens/Onboarding";
import RosterScreen from "./screens/RosterScreen";
import PlayerScreen from "./screens/PlayerScreen";
import TrainingScreen from "./screens/TrainingScreen";
import LineupScreen from "./screens/LineupScreen";
import MatchPreview from "./screens/MatchPreview";
import MatchLive from "./screens/MatchLive";
import MatchSynthesis from "./screens/MatchSynthesis";
import MercatoScreen from "./screens/MercatoScreen";
import SeasonEnd from "./screens/SeasonEnd";
import CloudPanel from "./screens/CloudPanel";
import { DashboardIcon, RosterIcon, MatchIcon, MercatoIcon, PlusIcon } from "./icons";
import { useToast } from "./useToast";
import { FORMATION_LABELS } from "./trait-labels";
import Crest from "./Crest";
import { getClub } from "../src/data/clubs";
import { createNewGame, currentFixture, currentFormation, saveGame, loadGame, clearSavedGame, type GameState } from "../lib/game";
import type { Consignes, FormationId } from "../src/data/types";
import type { MatchResult } from "../src/engine/match";

type Tab = "dashboard" | "roster" | "match" | "mercato" | "plus";
type SubScreen =
  | { type: "player"; id: string }
  | { type: "training" }
  | { type: "lineup" }
  | { type: "live"; lineupIds: string[]; consignes: Consignes }
  | { type: "synthesis"; opponent: string; result: MatchResult; lineupIds: string[] }
  | { type: "season-end" }
  | null;

export default function GameApp() {
  const [game, setGame] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sub, setSub] = useState<SubScreen>(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const { message, toast } = useToast();

  // Filet de sécurité local (§2 du plan d'affinage P2) : au premier montage côté client,
  // reprend une partie sauvegardée s'il y en a une. Fait exprès en effet (pas en initializer
  // useState) pour éviter un mismatch d'hydratation SSR (le serveur n'a pas de localStorage).
  useEffect(() => {
    const loaded = loadGame();
    if (loaded) setGame(loaded);
    setResumeChecked(true);
  }, []);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  function updateGame(updater: (g: GameState) => GameState) {
    setGame((prev) => (prev ? updater(prev) : prev));
  }

  function newWorld() {
    clearSavedGame();
    setGame(null);
    setTab("dashboard");
    setSub(null);
  }

  if (!resumeChecked) {
    return <div className="app-shell" />;
  }

  if (!game) {
    return (
      <div className="app-shell">
        <Onboarding
          onStart={(worldName, clubCode) => {
            const seed = `${worldName}-${clubCode}-${Date.now()}`;
            setGame(createNewGame(worldName, clubCode, seed));
            setTab("dashboard");
          }}
        />
      </div>
    );
  }

  const club = getClub(game.clubCode);
  const showTabbar = sub === null;

  function goTab(t: Tab) {
    setTab(t);
    setSub(null);
  }

  return (
    <div className="app-shell">
      {sub === null && tab === "dashboard" && (
        game.seasonReport ? (
          <SeasonEnd game={game} />
        ) : (
          <Dashboard
            game={game}
            onOpenLineup={() => setSub({ type: "lineup" })}
            onOpenTraining={() => setSub({ type: "training" })}
          />
        )
      )}
      {sub === null && tab === "roster" && (
        <RosterScreen game={game} onOpenPlayer={(id) => setSub({ type: "player", id })} onOpenTraining={() => setSub({ type: "training" })} />
      )}
      {sub === null && tab === "match" && (
        <MatchPreview game={game} onOpenLineup={() => setSub({ type: "lineup" })} />
      )}
      {sub === null && tab === "mercato" && <MercatoScreen game={game} setGame={updateGame} toast={toast} />}
      {sub === null && tab === "plus" && (
        <PlusScreen
          game={game}
          onNewWorld={newWorld}
          onLoadGame={(loaded) => {
            setGame(loaded);
            setTab("dashboard");
          }}
          toast={toast}
        />
      )}

      {sub?.type === "player" && (
        <PlayerScreen game={game} tireurId={sub.id} onBack={() => setSub(null)} />
      )}
      {sub?.type === "training" && (
        <TrainingScreen
          game={game}
          setGame={updateGame}
          onBack={() => setSub(null)}
          toast={toast}
        />
      )}
      {sub?.type === "lineup" && (
        <LineupScreen
          game={game}
          onBack={() => setSub(null)}
          onLaunch={(lineupIds, consignes) => setSub({ type: "live", lineupIds, consignes })}
        />
      )}
      {sub?.type === "live" && (
        <MatchLive
          game={game}
          lineupIds={sub.lineupIds}
          initialConsignes={sub.consignes}
          onBack={() => setSub(null)}
          onFinished={(opponent, result) => setSub({ type: "synthesis", opponent, result, lineupIds: sub.lineupIds })}
        />
      )}
      {sub?.type === "synthesis" && (
        <MatchSynthesis
          game={game}
          setGame={updateGame}
          opponent={sub.opponent}
          result={sub.result}
          lineupIds={sub.lineupIds}
          onDone={(finished) => {
            setSub(finished ? { type: "season-end" } : null);
            setTab("dashboard");
          }}
        />
      )}
      {sub?.type === "season-end" && game.seasonReport && <SeasonEnd game={game} />}

      {showTabbar && (
        <nav className="tabbar">
          <button className={`tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => goTab("dashboard")}>
            <span className="tab__glyph"><DashboardIcon /></span>Tableau de bord
          </button>
          <button className={`tab ${tab === "roster" ? "active" : ""}`} onClick={() => goTab("roster")}>
            <span className="tab__glyph"><RosterIcon /></span>Effectif
          </button>
          <button className={`tab ${tab === "match" ? "active" : ""}`} onClick={() => goTab("match")}>
            <span className="tab__glyph"><MatchIcon /></span>Match
          </button>
          <button className={`tab ${tab === "mercato" ? "active" : ""}`} onClick={() => goTab("mercato")}>
            <span className="tab__glyph"><MercatoIcon /></span>Mercato
          </button>
          <button className={`tab ${tab === "plus" ? "active" : ""}`} onClick={() => goTab("plus")}>
            <span className="tab__glyph"><PlusIcon /></span>Plus
          </button>
        </nav>
      )}
      <div className={`toast ${message ? "show" : ""}`}>{message}</div>
    </div>
  );
}

function Dashboard({ game, onOpenLineup, onOpenTraining }: { game: GameState; onOpenLineup: () => void; onOpenTraining: () => void }) {
  const club = getClub(game.clubCode);
  const fixture = currentFixture(game);
  const formation = currentFormation(game);
  const standing = game.standings[game.league].find((r) => r.code === game.clubCode);
  const rank = game.standings[game.league].findIndex((r) => r.code === game.clubCode) + 1;
  const opponentCode = fixture ? (fixture.home === game.clubCode ? fixture.away : fixture.home) : null;
  const opponent = opponentCode ? getClub(opponentCode) : null;
  const isHome = fixture?.home === game.clubCode;

  return (
    <section className="screen">
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 10 }}>
          <Crest code={club.code} size="lg" />
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.02rem" }}>{club.name}</div>
            <div style={{ fontSize: ".7rem", color: "var(--text-dim)" }}>{game.league === "L1" ? "Ligue 1 Connetable" : "Ligue 2 Capitaine Cook"} · Journée {Math.min(game.journee, 18)}/18</div>
          </div>
        </div>
        <span className="pill pill--gold">{FORMATION_LABELS[formation]}</span>
      </div>

      <div className="panel">
        <div className="row">
          <div className="stat"><span className="stat__label">Classement</span><span className="stat__value">{rank}ᵉ</span></div>
          <div className="stat"><span className="stat__label">Trésorerie</span><span className="stat__value gold">{game.budget} Ⱥ</span></div>
          <div className="stat"><span className="stat__label">Bilan</span><span className="stat__value">{standing ? `${standing.wins}V ${standing.draws}N ${standing.losses}D` : "—"}</span></div>
        </div>
      </div>

      {game.journee <= 18 && opponent ? (
        <div className="dossier dossier--stamped">
          <div className="dossier__ref">DOSSIER N° {club.code}-{game.journee} — CONVOCATION DE MATCH</div>
          <h3>Prochain match : {isHome ? "vs" : "chez"} {opponent.name}</h3>
          <p>Formation en vigueur : <strong>{FORMATION_LABELS[formation]}</strong>. {game.trainingDoneThisJournee ? "Entraînement déjà validé cette semaine." : "Pensez à valider l'entraînement de la semaine."}</p>
          <button className="btn btn--primary" onClick={onOpenLineup}>Préparer la composition →</button>
        </div>
      ) : (
        <div className="dossier">
          <h3>Saison terminée</h3>
          <p>Consultez le bilan dans l'onglet Plus.</p>
        </div>
      )}

      <div className="panel">
        <h3>Accès rapides</h3>
        <button className="list-row" onClick={onOpenTraining}>
          <span className="list-row__body">
            <span className="list-row__title">Entraînement de la semaine</span>
            <span className="list-row__meta">{game.trainingDoneThisJournee ? "Validé" : "3 gestes à valider"}</span>
          </span>
          <span className="list-row__chev">›</span>
        </button>
      </div>
    </section>
  );
}

function PlusScreen({
  game,
  onNewWorld,
  onLoadGame,
  toast,
}: {
  game: GameState;
  onNewWorld: () => void;
  onLoadGame: (state: GameState) => void;
  toast: (msg: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs</span>
      <h1 className="screen-title">Plus</h1>
      <p className="screen-sub">Panthéon et profil manager arrivent avec P3 (le monde persistant multi-saisons) — cette maquette P2 se concentre sur la boucle d'une saison.</p>

      <CloudPanel game={game} onLoadGame={onLoadGame} toast={toast} />

      <div className="panel">
        <h3>Gazette du Bassin</h3>
        {game.depeches.length === 0 ? (
          <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>
            Aucune dépêche pour l'instant — le Bureau publiera ses premières notes après votre premier match.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {game.depeches.map((d) => (
              <div key={d.id} className={`feed-ev ${d.family === "gazette" ? "milestone" : "home"}`}>
                <span className="feed-ev__time">J{d.journee}</span>
                {d.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Sauvegarde locale</h3>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginBottom: 12 }}>
          Votre monde est sauvegardé automatiquement dans ce navigateur à chaque journée.
        </p>
        {!confirming ? (
          <button className="btn btn--ghost" onClick={() => setConfirming(true)}>Recommencer un nouveau monde</button>
        ) : (
          <>
            <p style={{ fontSize: ".78rem", color: "var(--danger)", marginBottom: 12 }}>
              Cela efface définitivement la saison en cours. Confirmer ?
            </p>
            <div className="sheet-actions">
              <button className="btn btn--primary btn--sm" onClick={onNewWorld}>Oui, tout effacer</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
