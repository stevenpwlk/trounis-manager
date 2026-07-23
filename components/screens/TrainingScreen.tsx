"use client";
import { useState } from "react";
import type { GameState } from "../../lib/game";
import type { AttrKey } from "../../src/data/types";
import { ATTR_KEYS } from "../../src/data/types";
import { ATTR_LABELS } from "../trait-labels";
import { applyCollectiveSession, applySpecificWork } from "../../src/engine/training";
import { formeLabel } from "./RosterScreen";

const ATTR_SHORT: Record<AttrKey, string> = { cavite: "Cavité", apnee: "Apnée", anchois: "Anchois", discipline: "Discip.", souffle: "Souffle" };

export default function TrainingScreen({
  game,
  setGame,
  onBack,
  toast,
}: {
  game: GameState;
  setGame: (updater: (g: GameState) => GameState) => void;
  onBack: () => void;
  toast: (msg: string) => void;
}) {
  const roster = game.rosters[game.clubCode]!;
  const [collectiveAttr, setCollectiveAttr] = useState<AttrKey>("cavite");
  const [specificId, setSpecificId] = useState(roster[0]!.id);
  const [specificAttr, setSpecificAttr] = useState<AttrKey>("cavite");
  const [restedId, setRestedId] = useState<string>(() => [...roster].sort((a, b) => a.forme - b.forme)[0]!.id);

  const done = game.trainingDoneThisJournee;

  function validate() {
    setGame((g) => {
      const nextRoster = g.rosters[g.clubCode]!.map((t) => ({ ...t, attrs: { ...t.attrs } }));
      applyCollectiveSession(nextRoster, collectiveAttr);
      const target = nextRoster.find((t) => t.id === specificId);
      if (target) applySpecificWork(target, specificAttr);
      return {
        ...g,
        rosters: { ...g.rosters, [g.clubCode]: nextRoster },
        trainingDoneThisJournee: true,
        restedTireurId: restedId,
      };
    });
    toast("Entraînement validé — le Bureau enregistre le dossier.");
    onBack();
  }

  function delegate() {
    setGame((g) => {
      const nextRoster = g.rosters[g.clubCode]!.map((t) => ({ ...t, attrs: { ...t.attrs } }));
      const weakestOverallAttr = ATTR_KEYS.slice().sort((a, b) => {
        const avg = (k: AttrKey) => nextRoster.reduce((s, t) => s + t.attrs[k], 0) / nextRoster.length;
        return avg(a) - avg(b);
      })[0]!;
      applyCollectiveSession(nextRoster, weakestOverallAttr);
      const youngest = [...nextRoster].sort((a, b) => a.age - b.age)[0]!;
      applySpecificWork(youngest, weakestOverallAttr);
      const lowestForme = [...nextRoster].sort((a, b) => a.forme - b.forme)[0]!;
      return {
        ...g,
        rosters: { ...g.rosters, [g.clubCode]: nextRoster },
        trainingDoneThisJournee: true,
        restedTireurId: lowestForme.id,
      };
    });
    toast("Le Bureau délègue : correct, mais jamais optimal.");
    onBack();
  }

  return (
    <section className="screen">
      <div className="subheader">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div><span className="eyebrow">3 gestes</span><h2>Entraînement de la semaine</h2></div>
      </div>

      {done && (
        <div className="dossier" style={{ marginBottom: 14 }}>
          <p style={{ margin: 0 }}>Déjà validé cette semaine.</p>
        </div>
      )}

      <div className="panel">
        <h3>① Séance collective</h3>
        <p style={{ fontSize: ".74rem", color: "var(--text-dim)", margin: "0 0 10px" }}>Tout l'effectif gagne de l'XP dans l'attribut choisi.</p>
        <div className="segmented">
          {ATTR_KEYS.map((k) => (
            <button key={k} className={collectiveAttr === k ? "active" : ""} onClick={() => setCollectiveAttr(k)} disabled={done}>
              {ATTR_SHORT[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>② Travail spécifique</h3>
        <select
          className="text-input"
          value={specificId}
          onChange={(e) => setSpecificId(e.target.value)}
          disabled={done}
          style={{ marginBottom: 10 }}
        >
          {roster.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="segmented">
          {ATTR_KEYS.map((k) => (
            <button key={k} className={specificAttr === k ? "active" : ""} onClick={() => setSpecificAttr(k)} disabled={done}>
              {ATTR_SHORT[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>③ Ménagé</h3>
        <select className="text-input" value={restedId} onChange={(e) => setRestedId(e.target.value)} disabled={done} style={{ marginBottom: 0 }}>
          {roster.map((t) => (
            <option key={t.id} value={t.id}>{t.name} — forme {formeLabel(t.forme)}</option>
          ))}
        </select>
      </div>

      {!done && (
        <>
          <button className="btn btn--primary" onClick={validate}>Valider la semaine</button>
          <div className="gap-sm" />
          <button className="btn btn--ghost" onClick={delegate}>Laisser le Bureau décider</button>
        </>
      )}
    </section>
  );
}
