"use client";
import { useRef, useState } from "react";
import type { GameState } from "../../lib/game";
import { currentFixture, currentFormation, currentBassin } from "../../lib/game";
import { getClub } from "../../src/data/clubs";
import { MatchSession, type MatchResult } from "../../src/engine/match";
import { createRng } from "../../src/engine/rng";
import { DEFAULT_CONSIGNES } from "../../src/data/types";
import type { Consignes, Tempo, Ciblage, DisciplineConsigne } from "../../src/data/types";
import Crest from "../Crest";

function eventLabel(ev: { kind: string; side: string | null; homeDelta: number; awayDelta: number; period: number }): string {
  switch (ev.kind) {
    case "score":
      return `Fin de période ${ev.period} : ${ev.homeDelta} - ${ev.awayDelta}`;
    case "anchois":
      return `Anchois converti (${ev.side === "home" ? "domicile" : "extérieur"}, +1)`;
    case "saisine":
      return `Saisine du Conseil : un tireur ${ev.side === "home" ? "à domicile" : "à l'extérieur"} sort du match`;
    case "deflector":
      return `Un requin-marteau dévie l'action (${ev.side === "home" ? "domicile" : "extérieur"} pénalisé)`;
    default:
      return ev.kind;
  }
}

export default function MatchLive({
  game,
  lineupIds,
  initialConsignes,
  onBack,
  onFinished,
}: {
  game: GameState;
  lineupIds: string[];
  initialConsignes: Consignes;
  onBack: () => void;
  onFinished: (opponentCode: string, result: MatchResult) => void;
}) {
  const fixture = currentFixture(game);
  const opponentCode = fixture ? (fixture.home === game.clubCode ? fixture.away : fixture.home) : game.clubCode;
  const opponent = getClub(opponentCode);
  const club = getClub(game.clubCode);
  const isHome = fixture?.home === game.clubCode;
  const formation = currentFormation(game);

  const sessionRef = useRef<MatchSession | null>(null);
  const [, forceUpdate] = useState(0);
  const [timeoutUsed, setTimeoutUsed] = useState(false);
  const [showConsignesPanel, setShowConsignesPanel] = useState<"halftime" | "timeout" | null>(null);
  const [tempo, setTempo] = useState<Tempo>(initialConsignes.tempo);
  const [ciblage, setCiblage] = useState<Ciblage>(initialConsignes.ciblage);
  const [discipline, setDiscipline] = useState<DisciplineConsigne>(initialConsignes.discipline);

  if (!sessionRef.current) {
    const playerRoster = game.rosters[game.clubCode]!.filter((t) => lineupIds.includes(t.id));
    const homeRoster = isHome ? playerRoster : game.rosters[opponentCode]!;
    const awayRoster = isHome ? game.rosters[opponentCode]! : playerRoster;
    sessionRef.current = new MatchSession({
      homeRoster,
      awayRoster,
      formation,
      homeConsignes: isHome ? initialConsignes : DEFAULT_CONSIGNES,
      awayConsignes: isHome ? DEFAULT_CONSIGNES : initialConsignes,
      conditions: currentBassin(game),
      rng: createRng(`${game.seed}-match-${game.journee}`),
    });
  }
  const session = sessionRef.current;

  function next() {
    const wasAtPeriod2 = session.period === 2;
    session.playNextPeriod();
    forceUpdate((n) => n + 1);
    if (!wasAtPeriod2 && session.period === 2) {
      setShowConsignesPanel("halftime");
    }
  }

  function applyConsignesChange() {
    session.setConsignes(isHome ? "home" : "away", { tempo, ciblage, discipline });
    setShowConsignesPanel(null);
  }

  function useTimeout() {
    setTimeoutUsed(true);
    setShowConsignesPanel("timeout");
  }

  function simulateToEnd() {
    while (!session.isFinished()) session.playNextPeriod();
    setShowConsignesPanel(null);
    forceUpdate((n) => n + 1);
  }

  const score = session.getScore();
  const canTimeout = !timeoutUsed && session.period >= 2 && session.period <= 3 && !session.isFinished();

  return (
    <section className="screen screen--live">
      <div className="subheader">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div><span className="eyebrow">En direct</span><h2>{club.name} — {opponent.name}</h2></div>
      </div>

      <div className="scorebug">
        <div className="scorebug__team"><Crest code={isHome ? club.code : opponent.code} /><span className="scorebug__name">{isHome ? club.code : opponent.code}</span></div>
        <div style={{ textAlign: "center" }}>
          <div><span className="scorebug__score">{score.home}</span>–<span className="scorebug__score">{score.away}</span></div>
          <span className="scorebug__period">{session.isFinished() ? "Terminé" : session.period === 0 ? "Avant-match" : `Période ${session.period}`}</span>
        </div>
        <div className="scorebug__team right"><Crest code={isHome ? opponent.code : club.code} /><span className="scorebug__name">{isHome ? opponent.code : club.code}</span></div>
      </div>

      {showConsignesPanel && (
        <div className="dossier" style={{ marginBottom: 14 }}>
          <div className="dossier__ref">{showConsignesPanel === "halftime" ? "MI-TEMPS" : "TEMPS MORT"}</div>
          <h3>Ajuster les consignes ?</h3>
          <div className="segmented" style={{ marginBottom: 8 }}>
            <button className={tempo === "prudent" ? "active" : ""} onClick={() => setTempo("prudent")}>Prudent</button>
            <button className={tempo === "equilibre" ? "active" : ""} onClick={() => setTempo("equilibre")}>Équilibré</button>
            <button className={tempo === "offensif" ? "active" : ""} onClick={() => setTempo("offensif")}>Offensif</button>
          </div>
          <div className="segmented" style={{ marginBottom: 8 }}>
            <button className={ciblage === "cibler-apnee" ? "active" : ""} onClick={() => setCiblage("cibler-apnee")}>Cibler l'apnée</button>
            <button className={ciblage === "tenir-cavite" ? "active" : ""} onClick={() => setCiblage("tenir-cavite")}>Tenir la cavité</button>
          </div>
          <div className="segmented" style={{ marginBottom: 12 }}>
            <button className={discipline === "provoquer" ? "active" : ""} onClick={() => setDiscipline("provoquer")}>Provoquer</button>
            <button className={discipline === "jouer-propre" ? "active" : ""} onClick={() => setDiscipline("jouer-propre")}>Jouer propre</button>
          </div>
          <button className="btn btn--primary btn--sm" onClick={applyConsignesChange}>Confirmer et continuer</button>
        </div>
      )}

      <div className="feed-scroll">
        <div className="feed">
          {session.events.map((ev, i) => (
            <div key={i} className={`feed-ev ${ev.kind === "saisine" || ev.kind === "deflector" ? "milestone" : ev.side ?? ""}`}>
              <span className="feed-ev__time">P{ev.period}</span>
              {eventLabel(ev)}
            </div>
          ))}
        </div>
      </div>

      <div className="live-actions">
        {!session.isFinished() && !showConsignesPanel && (
          <button className="btn btn--primary" onClick={next}>▶ Événement suivant</button>
        )}
        {!session.isFinished() && !showConsignesPanel && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} disabled={!canTimeout} onClick={useTimeout}>
              Temps mort {timeoutUsed ? "(utilisé)" : "(1 disponible)"}
            </button>
            <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={simulateToEnd}>
              Simuler la fin »
            </button>
          </div>
        )}
        {session.isFinished() && (
          <button className="btn btn--primary" onClick={() => onFinished(opponentCode, session.getResult())}>
            Voir la synthèse →
          </button>
        )}
      </div>
    </section>
  );
}
