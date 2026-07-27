"use client";
import { useMemo, useState } from "react";
import { CLUBS, getClub } from "../../src/data/clubs";
import { ATTR_LABELS } from "../trait-labels";
import Crest from "../Crest";

const RECOMMENDED = new Set(["CCG", "PAP", "ABR"]);
const LEAGUE_LABELS = { L1: "Ligue 1 Connetable", L2: "Ligue 2 Capitaine Cook" } as const;

export default function Onboarding({ onStart }: { onStart: (worldName: string, clubCode: string) => void }) {
  const [tab, setTab] = useState<"L1" | "L2">("L1");
  const [worldName, setWorldName] = useState("Ma Renaissance");
  const [previewClub, setPreviewClub] = useState<string | null>(null);
  const clubs = useMemo(() => CLUBS.filter((c) => c.league === tab), [tab]);

  if (previewClub) {
    const club = getClub(previewClub);
    const terroirEntries = Object.entries(club.terroir) as Array<[keyof typeof ATTR_LABELS, number]>;
    return (
      <section className="screen">
        <div className="subheader">
          <button className="back-btn" onClick={() => setPreviewClub(null)}>‹</button>
          <div>
            <span className="eyebrow">Fiche du club</span>
            <h2>
              {club.name}
              {club.code === "ALB" && <span className="pill pill--danger" style={{ marginLeft: 6 }}>Mode difficile</span>}
              {RECOMMENDED.has(club.code) && <span className="pill pill--gold" style={{ marginLeft: 6 }}>Recommandé</span>}
            </h2>
          </div>
        </div>

        <div className="dossier" style={{ textAlign: "center" }}>
          <Crest code={club.code} size="xl" />
          <p style={{ marginTop: 8, marginBottom: 0 }}>{club.country} · {LEAGUE_LABELS[club.league]}</p>
        </div>

        <div className="panel">
          <h3>Objectif de direction</h3>
          <p>{club.objectiveText}</p>
        </div>

        <div className="panel">
          <div className="row">
            <div className="stat"><span className="stat__label">Force lore</span><span className="stat__value">{club.forceLore}</span></div>
            <div className="stat"><span className="stat__label">Budget</span><span className="stat__value gold">{club.budget} Ⱥ</span></div>
          </div>
        </div>

        {terroirEntries.length > 0 && (
          <div className="panel">
            <h3>Terroir</h3>
            <p>Le club forme et recrute naturellement des profils {terroirEntries.map(([k]) => ATTR_LABELS[k]).join(" / ")}.</p>
          </div>
        )}

        <button className="btn btn--primary" onClick={() => onStart(worldName.trim() || "Mon monde", club.code)}>
          Confirmer ce club
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs — F.I.S.T.</span>
      <h1 className="screen-title">Choisissez votre club</h1>
      <p className="screen-sub">20 clubs, 2 ligues. Le Bureau recommande un club de milieu de tableau pour un premier monde — mais vous restez libre.</p>

      <label className="field-label">Nom de ce monde</label>
      <input className="text-input" type="text" value={worldName} onChange={(e) => setWorldName(e.target.value)} />

      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={tab === "L1" ? "active" : ""} onClick={() => setTab("L1")}>Ligue 1 Connetable</button>
        <button className={tab === "L2" ? "active" : ""} onClick={() => setTab("L2")}>Ligue 2 Capitaine Cook</button>
      </div>

      <div className="panel" style={{ padding: "4px 15px" }}>
        {clubs.map((club) => (
          <button key={club.code} className="list-row" onClick={() => setPreviewClub(club.code)}>
            <Crest code={club.code} />
            <span className="list-row__body">
              <span className="list-row__title">
                {club.name}
                {RECOMMENDED.has(club.code) && <span className="pill pill--gold">Recommandé</span>}
                {club.code === "ALB" && <span className="pill pill--danger">Mode difficile</span>}
              </span>
              <span className="list-row__meta">{club.country} · Force {club.forceLore} · Budget {club.budget} Ⱥ · {club.objectiveText}</span>
            </span>
            <span className="list-row__chev">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
