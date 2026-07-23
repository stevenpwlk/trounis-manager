"use client";
import type { GameState } from "../../lib/game";
import { TRAIT_LABELS } from "../trait-labels";

export default function RosterScreen({
  game,
  onOpenPlayer,
  onOpenTraining,
}: {
  game: GameState;
  onOpenPlayer: (id: string) => void;
  onOpenTraining: () => void;
}) {
  const roster = game.rosters[game.clubCode]!;
  const sorted = [...roster].sort((a, b) => b.isStar === a.isStar ? 0 : b.isStar ? 1 : -1);

  return (
    <section className="screen">
      <span className="eyebrow-label">Effectif</span>
      <h1 className="screen-title">{roster.length} tireurs homologués</h1>
      <p className="screen-sub">Plancher 8, plafond 10.</p>

      <div className="dossier" style={{ marginBottom: 16 }}>
        <div className="dossier__ref">ENTRAÎNEMENT — SEMAINE EN COURS</div>
        <h3>{game.trainingDoneThisJournee ? "Entraînement validé" : "3 gestes à valider"}</h3>
        <p>Séance collective, travail spécifique, ménagé.</p>
        <button className="btn btn--primary" onClick={onOpenTraining}>Ouvrir l'entraînement →</button>
      </div>

      <div className="panel" style={{ padding: "4px 15px" }}>
        {sorted.map((t) => (
          <button key={t.id} className="list-row" onClick={() => onOpenPlayer(t.id)}>
            <span className="list-row__body">
              <span className="list-row__title">
                {t.name} <span className="trait-chip">{TRAIT_LABELS[t.trait]}</span>
              </span>
              <span className="list-row__meta">
                {t.age} ans {t.surnom ? `· « ${t.surnom} »` : ""} · Forme {formeLabel(t.forme)}
              </span>
            </span>
            <span className="list-row__chev">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function formeLabel(forme: number): string {
  if (forme >= 85) return "Excellente";
  if (forme >= 60) return "Bonne";
  if (forme >= 35) return "Moyenne";
  return "Basse";
}
