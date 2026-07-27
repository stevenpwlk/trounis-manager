"use client";
import type { GameState } from "../../lib/game";
import { type Prospect, potentialLabel, prospectSigningFee, SCOUT_COST } from "../../src/data/vivier";
import { getClub } from "../../src/data/clubs";
import { ATTR_KEYS, type Tireur } from "../../src/data/types";
import { TRAIT_LABELS, ATTR_LABELS } from "../trait-labels";
import Crest from "../Crest";

export default function VivierScreen({
  game,
  setGame,
  onDone,
  toast,
}: {
  game: GameState;
  setGame: (updater: (g: GameState) => GameState) => void;
  onDone: () => void;
  toast: (msg: string) => void;
}) {
  const pool = game.vivierPool ?? [];
  const spotted = pool.filter((p) => p.spotted);
  const roster = game.rosters[game.clubCode]!;

  function scout(p: Prospect) {
    if (game.budget < SCOUT_COST) {
      toast("Trésorerie insuffisante pour scouter.");
      return;
    }
    setGame((g) => ({
      ...g,
      budget: g.budget - SCOUT_COST,
      vivierPool: (g.vivierPool ?? []).map((x) => (x.id === p.id ? { ...x, scouted: true } : x)),
    }));
  }

  function recruit(p: Prospect) {
    const fee = prospectSigningFee(p);
    if (fee > game.budget) {
      toast("Trésorerie insuffisante.");
      return;
    }
    if (roster.length >= 10) {
      toast("Effectif au plafond (10) — vendez un tireur avant de recruter.");
      return;
    }
    setGame((g) => {
      if (g.rosters[g.clubCode]!.length >= 10) return g;
      const signed: Tireur = {
        id: `${g.clubCode}-vivier-${p.id}`,
        name: p.name,
        clubCode: g.clubCode,
        age: p.age,
        attrs: { ...p.attrs },
        trait: p.trait,
        isStar: false,
        forme: 100,
      };
      return {
        ...g,
        budget: g.budget - fee,
        rosters: { ...g.rosters, [g.clubCode]: [...g.rosters[g.clubCode]!, signed] },
        vivierPool: (g.vivierPool ?? []).filter((x) => x.id !== p.id),
      };
    });
    toast(`${p.name} rejoint le club pour ${fee} Ⱥ.`);
  }

  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs — Vivier annuel</span>
      <h1 className="screen-title">Les jeunes espoirs de la saison</h1>
      <p className="screen-sub">
        {spotted.length} profils repérés cette intersaison — le reste du Vivier reste hors de vue. Potentiel jamais garanti.
      </p>

      <div className="panel">
        <div className="row">
          <div className="stat"><span className="stat__label">Trésorerie</span><span className="stat__value gold">{game.budget} Ⱥ</span></div>
          <div className="stat"><span className="stat__label">Effectif</span><span className="stat__value">{roster.length} / 10</span></div>
        </div>
      </div>

      {spotted.map((p) => (
        <div className="panel" key={p.id}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Crest code={p.originClubCode} size="sm" />
              <span>
                <strong>{p.name}</strong> · {p.age} ans
                <br />
                <span style={{ fontSize: ".72rem", color: "var(--text-dim)" }}>
                  Issu de l'académie {getClub(p.originClubCode).name} · {TRAIT_LABELS[p.trait]}
                </span>
              </span>
            </span>
          </div>

          <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>{potentialLabel(p)}</p>

          {p.interestClubCode && (
            <p style={{ fontSize: ".72rem", color: "var(--text-dim)", margin: "0 0 8px" }}>
              {getClub(p.interestClubCode).name} a été aperçu en observation sur ce profil.
            </p>
          )}

          {p.scouted && (
            <div className="row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              {ATTR_KEYS.map((k) => (
                <span key={k} style={{ fontSize: ".72rem" }}>{ATTR_LABELS[k]} {Math.round(p.attrs[k])}</span>
              ))}
            </div>
          )}

          <div className="sheet-actions">
            {!p.scouted && (
              <button className="btn btn--ghost btn--sm" onClick={() => scout(p)}>Scouter ({SCOUT_COST} Ⱥ)</button>
            )}
            <button className="btn btn--primary btn--sm" onClick={() => recruit(p)}>Recruter ({prospectSigningFee(p)} Ⱥ)</button>
          </div>
        </div>
      ))}

      <button className="btn btn--primary" onClick={onDone}>Continuer vers la saison {game.season} »</button>
    </section>
  );
}
