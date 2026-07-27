import { ATTR_COLOR } from "./attrColors";
import type { TempoImpact } from "../../src/engine/preview";

const ROWS: Array<{ key: keyof TempoImpact; label: string }> = [
  { key: "cavite", label: "Cavité" },
  { key: "apnee", label: "Apnée" },
  { key: "anchois", label: "Anchois" },
];

export default function TempoImpactBars({ baseline, current }: { baseline: TempoImpact; current: TempoImpact }) {
  const maxScale = Math.max(1, ...ROWS.map((r) => Math.max(baseline[r.key], current[r.key]))) * 1.1;

  return (
    <div className="impact-bars">
      {ROWS.map((r) => {
        const b = baseline[r.key];
        const c = current[r.key];
        const delta = c - b;
        const color = ATTR_COLOR[r.key];
        return (
          <div className="impact-bar" key={r.key}>
            <div className="impact-bar__head">
              <span style={{ color }}>{r.label}</span>
              <span className="impact-bar__value">
                {c.toFixed(1)}
                {Math.abs(delta) >= 0.05 && (
                  <span style={{ color: delta > 0 ? "var(--ok)" : "var(--danger)" }}>
                    {" "}
                    ({delta > 0 ? "+" : ""}
                    {delta.toFixed(1)})
                  </span>
                )}
              </span>
            </div>
            <div className="impact-bar__track">
              <div className="impact-bar__baseline" style={{ left: `${(b / maxScale) * 100}%` }} />
              <div className="impact-bar__fill" style={{ width: `${(c / maxScale) * 100}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
