"use client";
import type { GameState } from "../../lib/game";
import { currentFixture, currentFormation, currentBassin } from "../../lib/game";
import { getClub } from "../../src/data/clubs";
import { FORMATION_LABELS, BASSIN_LABELS } from "../trait-labels";
import Crest from "../Crest";

export default function MatchPreview({ game, onOpenLineup }: { game: GameState; onOpenLineup: () => void }) {
  const fixture = currentFixture(game);
  const formation = currentFormation(game);
  const bassin = currentBassin(game);

  if (!fixture) {
    return (
      <section className="screen">
        <span className="eyebrow-label">Match</span>
        <h1 className="screen-title">Aucun match programmé</h1>
        <p className="screen-sub">La saison est terminée — consultez le bilan dans l'onglet Plus.</p>
      </section>
    );
  }

  const opponentCode = fixture.home === game.clubCode ? fixture.away : fixture.home;
  const opponent = getClub(opponentCode);
  const club = getClub(game.clubCode);
  const isHome = fixture.home === game.clubCode;

  return (
    <section className="screen">
      <span className="eyebrow-label">Prochain match — J{game.journee}</span>

      <div className="scorebug" style={{ marginTop: 4 }}>
        <div className="scorebug__team"><Crest code={isHome ? club.code : opponent.code} /><span className="scorebug__name">{isHome ? club.code : opponent.code}</span></div>
        <span className="scorebug__vs">VS</span>
        <div className="scorebug__team right"><Crest code={isHome ? opponent.code : club.code} /><span className="scorebug__name">{isHome ? opponent.code : club.code}</span></div>
      </div>

      <h1 className="screen-title">{isHome ? `${club.name} — ${opponent.name}` : `${opponent.name} — ${club.name}`}</h1>
      <p className="screen-sub">Formation-règlement : {FORMATION_LABELS[formation]}</p>

      <div className="dossier">
        <div className="dossier__ref">FICHE DE BASSIN</div>
        <h3>Conditions annoncées</h3>
        <div className="row"><span>Salinité</span><span className="pill pill--muted">{BASSIN_LABELS[bassin.salinite]}</span></div>
        <div className="row"><span>Paprika</span><span className="pill pill--warn">{BASSIN_LABELS[bassin.paprika]}</span></div>
        <div className="row"><span>Risque marin</span><span className="pill pill--ok">{BASSIN_LABELS[bassin.risqueMarin]}</span></div>
      </div>

      <button className="btn btn--primary" onClick={onOpenLineup}>Préparer la composition →</button>
    </section>
  );
}
