"use client";
import type { GameState } from "../../lib/game";
import { ATTR_KEYS } from "../../src/data/types";
import RadarChart from "../RadarChart";
import { TRAIT_LABELS, ATTR_LABELS } from "../trait-labels";
import { tireurValue } from "../../src/engine/mercato";
import { formeLabel } from "./RosterScreen";

export default function PlayerScreen({ game, tireurId, onBack }: { game: GameState; tireurId: string; onBack: () => void }) {
  const roster = game.rosters[game.clubCode]!;
  const t = roster.find((r) => r.id === tireurId);
  if (!t) {
    return (
      <section className="screen">
        <div className="subheader"><button className="back-btn" onClick={onBack}>‹</button><h2>Introuvable</h2></div>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="subheader">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div><span className="eyebrow">Fiche fédérale</span><h2>{t.name}</h2></div>
      </div>

      <div className="dossier" style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ink-3)", border: "2px solid var(--gold)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--data)", fontWeight: 700, color: "var(--parchment-ink)", fontSize: "1.1rem" }}>
          {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        {t.surnom && <h3 style={{ marginBottom: 2 }}>« {t.surnom} »</h3>}
        <p style={{ marginBottom: 0 }}>{t.age} ans · {t.isStar ? "Star canonique" : "Effectif"} · <strong>{TRAIT_LABELS[t.trait]}</strong></p>
      </div>

      <div className="panel">
        <h3>Radar des attributs</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <RadarChart attrs={t.attrs} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {ATTR_KEYS.map((k) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem" }}>
                <span>{ATTR_LABELS[k]}</span>
                <span style={{ fontFamily: "var(--data)", fontWeight: 700, color: "var(--gold-bright)" }}>{Math.round(t.attrs[k])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row">
          <div className="stat"><span className="stat__label">Forme</span><span className="stat__value" style={{ color: "var(--ok)" }}>{formeLabel(t.forme)}</span></div>
          <div className="stat"><span className="stat__label">Valeur estimée</span><span className="stat__value gold">{tireurValue(t)} Ⱥ</span></div>
        </div>
      </div>
    </section>
  );
}
