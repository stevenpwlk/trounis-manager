import { ATTR_KEYS, type FormationId } from "../../src/data/types";
import { FORMATION_WEIGHTS } from "../../src/engine/formations";
import { ATTR_LABELS, FORMATION_LABELS } from "../trait-labels";
import { ATTR_COLOR } from "./attrColors";

export default function FormationPriorityBars({ formation }: { formation: FormationId }) {
  const weights = FORMATION_WEIGHTS[formation];
  const sorted = [...ATTR_KEYS].sort((a, b) => weights[b] - weights[a]);
  const max = Math.max(...ATTR_KEYS.map((k) => weights[k]));

  return (
    <div className="priority-bars">
      <p className="priority-bars__caption">Ce qui compte le plus en ce moment — {FORMATION_LABELS[formation]}</p>
      {sorted.map((k) => (
        <div className="priority-bar" key={k}>
          <span className="priority-bar__label" style={{ color: ATTR_COLOR[k] }}>
            {ATTR_LABELS[k]}
          </span>
          <div className="priority-bar__track">
            <div className="priority-bar__fill" style={{ width: `${(weights[k] / max) * 100}%`, background: ATTR_COLOR[k] }} />
          </div>
          <span className="priority-bar__val">×{weights[k].toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
