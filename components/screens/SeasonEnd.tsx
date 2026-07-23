"use client";
import type { GameState } from "../../lib/game";
import { getClub } from "../../src/data/clubs";

const PALIER_LABEL: Record<string, { label: string; className: string }> = {
  exploit: { label: "Exploit", className: "pill--gold" },
  conforme: { label: "Conforme", className: "pill--ok" },
  echec: { label: "Échec", className: "pill--danger" },
};

export default function SeasonEnd({ game }: { game: GameState }) {
  if (!game.seasonReport) return null;
  const club = getClub(game.clubCode);
  const { finalRank, standing, objectivePalier } = game.seasonReport;
  const palier = PALIER_LABEL[objectivePalier]!;

  return (
    <section className="screen">
      <span className="eyebrow-label">Bulletin officiel du Bureau</span>
      <h1 className="screen-title">Bilan de saison — {club.name}</h1>

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
      </div>

      <div className="panel">
        <h3>Classement final</h3>
        {game.standings[game.league].map((row, i) => (
          <div className="row" key={row.code}>
            <span style={{ fontSize: ".78rem" }}>{i + 1}. {getClub(row.code).name}</span>
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
