"use client";
import { useState } from "react";
import type { GameState } from "../../lib/game";
import { currentFixture, currentFormation, currentBassin } from "../../lib/game";
import { getClub } from "../../src/data/clubs";
import { SLOTS_BY_FORMATION } from "../../src/engine/formations";
import { pickLineup } from "../../src/engine/match";
import { DEFAULT_CONSIGNES } from "../../src/data/types";
import type { Consignes, Tempo, Ciblage, DisciplineConsigne } from "../../src/data/types";
import { FORMATION_LABELS, BASSIN_LABELS } from "../trait-labels";

export default function LineupScreen({
  game,
  onBack,
  onLaunch,
}: {
  game: GameState;
  onBack: () => void;
  onLaunch: (lineupIds: string[], consignes: Consignes) => void;
}) {
  const roster = game.rosters[game.clubCode]!;
  const formation = currentFormation(game);
  const slots = SLOTS_BY_FORMATION[formation];
  const fixture = currentFixture(game);
  const opponentCode = fixture ? (fixture.home === game.clubCode ? fixture.away : fixture.home) : null;
  const opponent = opponentCode ? getClub(opponentCode) : null;
  const bassin = currentBassin(game);

  const [selected, setSelected] = useState<string[]>(() => pickLineup(roster, formation).map((t) => t.id));
  const [tempo, setTempo] = useState<Tempo>(DEFAULT_CONSIGNES.tempo);
  const [ciblage, setCiblage] = useState<Ciblage>(DEFAULT_CONSIGNES.ciblage);
  const [discipline, setDiscipline] = useState<DisciplineConsigne>(DEFAULT_CONSIGNES.discipline);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= slots) return prev;
      return [...prev, id];
    });
  }

  const canLaunch = selected.length === slots;

  return (
    <section className="screen">
      <div className="subheader">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div><span className="eyebrow">Avant-match</span><h2>Composition & consignes</h2></div>
      </div>
      <p className="screen-sub">
        Formation-règlement : <strong>{FORMATION_LABELS[formation]}</strong>, {slots} tireurs. Le règlement impose la forme, vous choisissez les hommes.
        {opponent && <> Adversaire : <strong>{opponent.name}</strong>.</>}
      </p>

      <div className="dossier" style={{ marginBottom: 14 }}>
        <div className="dossier__ref">FICHE DE BASSIN</div>
        <div className="row"><span>Salinité</span><span className="pill pill--muted">{BASSIN_LABELS[bassin.salinite]}</span></div>
        <div className="row"><span>Paprika</span><span className="pill pill--warn">{BASSIN_LABELS[bassin.paprika]}</span></div>
        <div className="row"><span>Risque marin</span><span className="pill pill--ok">{BASSIN_LABELS[bassin.risqueMarin]}</span></div>
      </div>

      <div className="panel">
        <h3>Sélection ({selected.length}/{slots})</h3>
        {roster.map((t) => {
          const isSelected = selected.includes(t.id);
          return (
            <button
              key={t.id}
              className="list-row"
              onClick={() => toggle(t.id)}
              style={{ opacity: !isSelected && selected.length >= slots ? 0.4 : 1 }}
            >
              <span className="list-row__body">
                <span className="list-row__title">{t.name}</span>
                <span className="list-row__meta">{t.age} ans · forme {Math.round(t.forme)}</span>
              </span>
              <span className="pill" style={isSelected ? { background: "var(--gold)", color: "#20180a" } : { background: "var(--ink-3)", color: "var(--text-dim)" }}>
                {isSelected ? "Aligné" : "Banc"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <h3>Tempo</h3>
        <div className="segmented">
          <button className={tempo === "prudent" ? "active" : ""} onClick={() => setTempo("prudent")}>Prudent</button>
          <button className={tempo === "equilibre" ? "active" : ""} onClick={() => setTempo("equilibre")}>Équilibré</button>
          <button className={tempo === "offensif" ? "active" : ""} onClick={() => setTempo("offensif")}>Offensif</button>
        </div>
      </div>
      <div className="panel">
        <h3>Ciblage</h3>
        <div className="segmented">
          <button className={ciblage === "cibler-apnee" ? "active" : ""} onClick={() => setCiblage("cibler-apnee")}>Cibler l'apnée</button>
          <button className={ciblage === "tenir-cavite" ? "active" : ""} onClick={() => setCiblage("tenir-cavite")}>Tenir la cavité</button>
        </div>
      </div>
      <div className="panel">
        <h3>Discipline de jeu</h3>
        <div className="segmented">
          <button className={discipline === "provoquer" ? "active" : ""} onClick={() => setDiscipline("provoquer")}>Provoquer</button>
          <button className={discipline === "jouer-propre" ? "active" : ""} onClick={() => setDiscipline("jouer-propre")}>Jouer propre</button>
        </div>
      </div>

      <button className="btn btn--primary" disabled={!canLaunch} onClick={() => onLaunch(selected, { tempo, ciblage, discipline })}>
        Lancer le match →
      </button>
    </section>
  );
}
