"use client";
import { useMemo, useState } from "react";
import { CLUBS } from "../../src/data/clubs";

const RECOMMENDED = new Set(["CCG", "PAP", "ABR"]);

export default function Onboarding({ onStart }: { onStart: (worldName: string, clubCode: string) => void }) {
  const [tab, setTab] = useState<"L1" | "L2">("L1");
  const [worldName, setWorldName] = useState("Ma Renaissance");
  const clubs = useMemo(() => CLUBS.filter((c) => c.league === tab), [tab]);

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
          <button key={club.code} className="list-row" onClick={() => onStart(worldName.trim() || "Mon monde", club.code)}>
            <span className="crest-badge">{club.code}</span>
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
