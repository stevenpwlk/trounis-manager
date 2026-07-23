"use client";
import { useMemo, useState } from "react";
import type { GameState } from "../../lib/game";
import { getClub, CLUBS } from "../../src/data/clubs";
import { tireurValue, proposeBuy, sellPrice, type OfferResult } from "../../src/engine/mercato";
import { createRng } from "../../src/engine/rng";
import type { Tireur } from "../../src/data/types";

const RICH_THRESHOLD = 800;

export default function MercatoScreen({
  game,
  setGame,
  toast,
}: {
  game: GameState;
  setGame: (updater: (g: GameState) => GameState) => void;
  toast: (msg: string) => void;
}) {
  const roster = game.rosters[game.clubCode]!;
  const [offerFor, setOfferFor] = useState<{ tireur: Tireur; clubCode: string } | null>(null);
  const [offerAmount, setOfferAmount] = useState(0);
  const [pendingCounter, setPendingCounter] = useState<number | null>(null);

  const candidates = useMemo(() => {
    const rng = createRng(`${game.seed}-mercato-${game.journee}`);
    const others = CLUBS.filter((c) => c.code !== game.clubCode);
    const picks: { tireur: Tireur; clubCode: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const club = rng.pick(others);
      const clubRoster = game.rosters[club.code]!.filter((t) => !t.isStar);
      if (clubRoster.length === 0) continue;
      picks.push({ tireur: rng.pick(clubRoster), clubCode: club.code });
    }
    return picks;
  }, [game.seed, game.journee, game.rosters, game.clubCode]);

  function openOffer(pick: { tireur: Tireur; clubCode: string }) {
    setOfferFor(pick);
    setOfferAmount(tireurValue(pick.tireur));
    setPendingCounter(null);
  }

  function submitOffer() {
    if (!offerFor) return;
    const richClub = getClub(offerFor.clubCode).budget >= RICH_THRESHOLD;
    const result: OfferResult = proposeBuy(offerFor.tireur, offerAmount, { richClub, rng: createRng(`${game.seed}-offer-${Date.now()}`) });
    if (result.outcome === "accepted") {
      finalizeBuy(offerFor, result.price);
    } else if (result.outcome === "countered") {
      setPendingCounter(result.counterPrice);
    } else {
      toast(`${getClub(offerFor.clubCode).name} refuse l'offre.`);
      setOfferFor(null);
    }
  }

  function finalizeBuy(pick: { tireur: Tireur; clubCode: string }, price: number) {
    if (price > game.budget) {
      toast("Trésorerie insuffisante.");
      setOfferFor(null);
      return;
    }
    if (roster.length >= 10) {
      toast("Effectif au plafond (10) — vendez un tireur avant de recruter.");
      setOfferFor(null);
      return;
    }
    setGame((g) => {
      if (g.rosters[g.clubCode]!.length >= 10) return g;
      const bought: Tireur = { ...pick.tireur, id: `${g.clubCode}-signing-${Date.now()}`, clubCode: g.clubCode };
      return {
        ...g,
        budget: g.budget - price,
        rosters: {
          ...g.rosters,
          [g.clubCode]: [...g.rosters[g.clubCode]!, bought],
          [pick.clubCode]: g.rosters[pick.clubCode]!.filter((t) => t.id !== pick.tireur.id),
        },
      };
    });
    toast(`${pick.tireur.name} rejoint le club pour ${price} Ⱥ.`);
    setOfferFor(null);
  }

  function sell(tireur: Tireur) {
    if (roster.length <= 8) {
      toast("Effectif au plancher (8) — vente impossible.");
      return;
    }
    const price = sellPrice(tireur);
    setGame((g) => ({
      ...g,
      budget: g.budget + price,
      rosters: { ...g.rosters, [g.clubCode]: g.rosters[g.clubCode]!.filter((t) => t.id !== tireur.id) },
    }));
    toast(`${tireur.name} vendu pour ${price} Ⱥ.`);
  }

  return (
    <section className="screen">
      <span className="eyebrow-label">Bordereau de mercato</span>
      <h1 className="screen-title">Mercato</h1>

      <div className="panel">
        <div className="row">
          <div className="stat"><span className="stat__label">Trésorerie</span><span className="stat__value gold">{game.budget} Ⱥ</span></div>
          <div className="stat"><span className="stat__label">Effectif</span><span className="stat__value">{roster.length} / 10</span></div>
        </div>
      </div>

      {offerFor && (
        <div className="dossier" style={{ marginBottom: 14 }}>
          <div className="dossier__ref">OFFRE — {getClub(offerFor.clubCode).name}</div>
          <h3>{offerFor.tireur.name}</h3>
          <p>Valeur estimée : {tireurValue(offerFor.tireur)} Ⱥ</p>
          {pendingCounter === null ? (
            <>
              <input
                className="text-input"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(Number(e.target.value))}
              />
              <div className="sheet-actions" style={{ display: "flex", gap: 9 }}>
                <button className="btn btn--primary btn--sm" onClick={submitOffer}>Proposer</button>
                <button className="btn btn--ghost btn--sm" onClick={() => setOfferFor(null)}>Annuler</button>
              </div>
            </>
          ) : (
            <>
              <p>Contre-offre du club : <strong>{pendingCounter} Ⱥ</strong> (à prendre ou à laisser).</p>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="btn btn--primary btn--sm" onClick={() => finalizeBuy(offerFor, pendingCounter)}>Accepter</button>
                <button className="btn btn--ghost btn--sm" onClick={() => setOfferFor(null)}>Refuser</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="panel">
        <h3>Joueurs disponibles (autres clubs)</h3>
        {candidates.map((c, i) => (
          <div className="row" key={i}>
            <span style={{ fontSize: ".78rem" }}>{c.tireur.name} ({getClub(c.clubCode).name})</span>
            <button className="btn btn--ghost btn--sm" onClick={() => openOffer(c)}>Proposer</button>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Vendre un tireur</h3>
        {roster.map((t) => (
          <div className="row" key={t.id}>
            <span style={{ fontSize: ".78rem" }}>{t.name}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => sell(t)}>Vendre ({sellPrice(t)} Ⱥ)</button>
          </div>
        ))}
      </div>
    </section>
  );
}
