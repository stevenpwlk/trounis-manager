"use client";
import type { GameState } from "../../lib/game";
import { getClub } from "../../src/data/clubs";
import Crest from "../Crest";

const PALIER_LABEL: Record<string, { label: string; className: string }> = {
  exploit: { label: "Exploit", className: "pill--gold" },
  conforme: { label: "Conforme", className: "pill--ok" },
  echec: { label: "Échec", className: "pill--danger" },
};

const PROMOTION_LABEL: Record<string, { label: string; className: string }> = {
  monte: { label: "Monte", className: "pill--ok" },
  descend: { label: "Descend", className: "pill--danger" },
  maintien: { label: "Maintien", className: "pill--muted" },
};

export default function SeasonEnd({ game }: { game: GameState }) {
  if (!game.seasonReport) return null;
  const club = getClub(game.clubCode);
  const { finalRank, standing, objectivePalier, barrage, promotion, cup } = game.seasonReport;
  const palier = PALIER_LABEL[objectivePalier]!;
  const promoLabel = PROMOTION_LABEL[promotion]!;

  return (
    <section className="screen">
      <span className="eyebrow-label">Bulletin officiel du Bureau</span>
      <div className="row" style={{ marginBottom: 10, justifyContent: "flex-start", gap: 10 }}>
        <Crest code={club.code} size="lg" />
        <h1 className="screen-title" style={{ margin: 0 }}>Bilan de saison — {club.name}</h1>
      </div>

      <div className="dossier dossier--stamped">
        <div className="dossier__ref">DOSSIER N° {club.code}-BILAN</div>
        <h3>{finalRank}ᵉ place, {game.league === "L1" ? "Ligue 1 Connetable" : "Ligue 2 Capitaine Cook"}</h3>
        <p>{standing.wins}V {standing.draws}N {standing.losses}D — {standing.pointsFor} pts marqués, {standing.pointsAgainst} encaissés.</p>
      </div>

      <div className="panel">
        <div className="row">
          <span>Objectif de direction</span>
          <span className={`pill ${palier.className}`}>{palier.label}</span>
        </div>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginTop: 8 }}>{club.objectiveText}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <span>Sort de fin de saison</span>
          <span className={`pill ${promoLabel.className}`}>{promoLabel.label}</span>
        </div>
      </div>

      <div className={`dossier ${barrage.involvesPlayer ? "dossier--stamped" : ""}`}>
        <div className="dossier__ref">BARRAGE — 8e LIGUE 1 CONNETABLE vs 3e LIGUE 2 CAPITAINE COOK</div>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Crest code={barrage.home} size="sm" /> {getClub(barrage.home).name}
          <span style={{ fontWeight: 400 }}>{barrage.result.homeScore} – {barrage.result.awayScore}</span>
          {getClub(barrage.away).name} <Crest code={barrage.away} size="sm" />
        </h3>
        <p>
          {getClub(barrage.winner).name} se maintient/monte en Ligue 1 Connetable.
          {barrage.involvesPlayer && " Votre club était directement concerné par ce barrage."}
        </p>
      </div>

      <div className="panel">
        <h3>Coupe de la F.I.S.T.</h3>
        <div className="row">
          <span>Vainqueur de la Coupe</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".82rem", fontWeight: 700 }}>
            <Crest code={cup.champion} size="sm" /> {getClub(cup.champion).name}
          </span>
        </div>
        <div className="row" style={{ marginTop: 9 }}>
          <span>Votre parcours</span>
          <span className="pill pill--muted">
            {cup.champion === game.clubCode
              ? "Vainqueur"
              : cup.playerEliminatedBy
                ? `Éliminé — ${cup.playerReached}`
                : cup.playerReached}
          </span>
        </div>
        {cup.playerEliminatedBy && (
          <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginTop: 8 }}>
            Sorti par {getClub(cup.playerEliminatedBy).name}.
          </p>
        )}
      </div>

      <div className="panel">
        <h3>Classement final</h3>
        {game.standings[game.league].map((row, i) => (
          <div className={`row standings-row ${row.code === game.clubCode ? "standings-row--self" : ""}`} key={row.code}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="standings-row__rank">{i + 1}</span>
              <Crest code={row.code} size="sm" />
              <span style={{ fontSize: ".78rem" }}>{getClub(row.code).name}</span>
            </span>
            <span className="stat__value" style={{ fontSize: ".82rem" }}>{row.leaguePoints} pts</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>
          La persistance multi-saisons (carrière, Panthéon, Vivier, mercato IA) arrive avec P3 — cette
          maquette P2 démontre la boucle complète d'UNE saison, du choix du club au bilan final.
        </p>
      </div>
    </section>
  );
}
