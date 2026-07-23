"use client";
import { useState } from "react";
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
import { DashboardIcon, RosterIcon, MatchIcon, MercatoIcon, PlusIcon } from "./icons";
import { useToast } from "./useToast";
import { FORMATION_LABELS } from "./trait-labels";
import { getClub } from "../src/data/clubs";
import { createNewGame, currentFixture, currentFormation, type GameState } from "../lib/game";
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
  const { message, toast } = useToast();

  function updateGame(updater: (g: GameState) => GameState) {
    setGame((prev) => (prev ? updater(prev) : prev));
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
        <Dashboard
          game={game}
          onOpenLineup={() => setSub({ type: "lineup" })}
          onOpenTraining={() => setSub({ type: "training" })}
        />
      )}
      {sub === null && tab === "roster" && (
        <RosterScreen game={game} onOpenPlayer={(id) => setSub({ type: "player", id })} onOpenTraining={() => setSub({ type: "training" })} />
      )}
      {sub === null && tab === "match" && (
        <MatchPreview game={game} onOpenLineup={() => setSub({ type: "lineup" })} />
      )}
      {sub === null && tab === "mercato" && <MercatoScreen game={game} setGame={updateGame} toast={toast} />}
      {sub === null && tab === "plus" && <PlusScreen />}

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
          <span className="crest-badge lg">{club.code}</span>
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

function PlusScreen() {
  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs</span>
      <h1 className="screen-title">Plus</h1>
      <p className="screen-sub">Gazette, Panthéon et profil manager arrivent avec P3 (le monde persistant multi-saisons) — cette maquette P2 se concentre sur la boucle d'une saison.</p>
    </section>
  );
}
