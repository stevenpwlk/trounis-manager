"use client";
import type { ReactElement } from "react";
import { ATTR_KEYS, type AttrKey } from "../../src/data/types";
import { ATTR_LABELS } from "../trait-labels";
import { ATTR_INFO, ATTR_MARKET_NOTE, TEMPO_INFO, CIBLAGE_INFO, DISCIPLINE_CONSIGNE_INFO } from "../glossaryContent";
import { CaviteIcon, ApneeIcon, AnchoisIcon, DisciplineIcon, SouffleIcon } from "../icons";

const ATTR_ICON: Record<AttrKey, () => ReactElement> = {
  cavite: CaviteIcon,
  apnee: ApneeIcon,
  anchois: AnchoisIcon,
  discipline: DisciplineIcon,
  souffle: SouffleIcon,
};

function ConsigneRow({ label, effect }: { label: string; effect: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <strong style={{ fontSize: ".84rem" }}>{label}</strong>
      <p style={{ fontSize: ".76rem", color: "var(--text-dim)", margin: "2px 0 0", lineHeight: 1.5 }}>{effect}</p>
    </div>
  );
}

export default function GlossaryScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="screen">
      <div className="subheader">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div><span className="eyebrow">Bureau des Entraîneurs</span><h2>Lexique du Bureau</h2></div>
      </div>
      <p className="screen-sub">
        À quoi servent vraiment les attributs et les consignes de match — les chiffres du moteur, pas du discours d'ambiance.
      </p>

      <h3 style={{ margin: "4px 0 10px" }}>Les 5 attributs</h3>
      {ATTR_KEYS.map((k) => {
        const info = ATTR_INFO[k];
        const Icon = ATTR_ICON[k];
        return (
          <div className="panel" key={k}>
            <div className="row" style={{ marginBottom: 8, justifyContent: "flex-start", gap: 10 }}>
              <span className="glossary-icon"><Icon /></span>
              <strong style={{ fontFamily: "var(--display)", fontSize: ".92rem" }}>{ATTR_LABELS[k]}</strong>
              <span className="pill pill--muted">{info.roleTag}</span>
            </div>
            <p style={{ fontSize: ".8rem", color: "var(--text)", margin: "0 0 8px", fontWeight: 600 }}>{info.summary}</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".76rem", color: "var(--text-dim)", lineHeight: 1.6 }}>
              {info.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="screen-sub" style={{ fontSize: ".72rem" }}>{ATTR_MARKET_NOTE}</p>

      <h3 style={{ margin: "18px 0 10px" }}>Tempo</h3>
      <div className="panel">
        {(["offensif", "equilibre", "prudent"] as const).map((k) => (
          <ConsigneRow key={k} label={TEMPO_INFO[k].label} effect={TEMPO_INFO[k].effect} />
        ))}
      </div>

      <h3 style={{ margin: "18px 0 10px" }}>Ciblage</h3>
      <div className="panel">
        {(["cibler-apnee", "tenir-cavite"] as const).map((k) => (
          <ConsigneRow key={k} label={CIBLAGE_INFO[k].label} effect={CIBLAGE_INFO[k].effect} />
        ))}
      </div>

      <h3 style={{ margin: "18px 0 10px" }}>Discipline de jeu</h3>
      <div className="panel">
        {(["provoquer", "jouer-propre"] as const).map((k) => (
          <ConsigneRow key={k} label={DISCIPLINE_CONSIGNE_INFO[k].label} effect={DISCIPLINE_CONSIGNE_INFO[k].effect} />
        ))}
      </div>
    </section>
  );
}
