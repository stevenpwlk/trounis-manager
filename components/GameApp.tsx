"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Login from "./screens/Login";
import WorldSelect from "./screens/WorldSelect";
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
import Crest from "./Crest";
import { getClub } from "../src/data/clubs";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import { saveCloudSlot } from "../lib/supabase/saves";
import { currentFixture, currentFormation, type GameState } from "../lib/game";
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
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sub, setSub] = useState<SubScreen>(null);
  const { message, toast } = useToast();

  // Trounis Manager vit entièrement en ligne : connexion obligatoire, l'état de jeu n'existe
  // que dans manager_saves (pas de filet local — décision explicite avec Steven le 2026-07-23,
  // qui remplace le premier jet "autosave localStorage" pour rester cohérent avec le reste de
  // l'écosystème "tout en ligne").
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthChecked(true);
      return;
    }
    client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });
    const { data: authSub } = client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUserId(session?.user.id ?? null);
      if (!session) {
        setActiveSlot(null);
        setGame(null);
      }
    });
    return () => authSub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId && activeSlot && game) saveCloudSlot(userId, activeSlot, game);
  }, [game]);

  function updateGame(updater: (g: GameState) => GameState) {
    setGame((prev) => (prev ? updater(prev) : prev));
  }

  function backToWorldSelect() {
    setActiveSlot(null);
    setGame(null);
    setTab("dashboard");
    setSub(null);
  }

  if (!authChecked) {
    return <div className="app-shell" />;
  }

  if (!userId) {
    return (
      <div className="app-shell">
        <Login onLoggedIn={() => {}} />
      </div>
    );
  }

  if (!activeSlot || !game) {
    return (
      <div className="app-shell">
        <WorldSelect
          userId={userId}
          onEnter={(slot, state) => {
            setActiveSlot(slot);
            setGame(state);
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
      {sub === null && tab === "plus" && <PlusScreen game={game} onChangeWorld={backToWorldSelect} />}

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

function PlusScreen({ game, onChangeWorld }: { game: GameState; onChangeWorld: () => void }) {
  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs</span>
      <h1 className="screen-title">Plus</h1>
      <p className="screen-sub">Panthéon et profil manager arrivent avec P3 (le monde persistant multi-saisons) — cette maquette P2 se concentre sur la boucle d'une saison.</p>

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
        <h3>Votre monde</h3>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginBottom: 12 }}>
          Sauvegardé automatiquement en ligne sur votre compte à chaque action.
        </p>
        <button className="btn btn--ghost" onClick={onChangeWorld}>Changer de monde</button>
      </div>
    </section>
  );
}
