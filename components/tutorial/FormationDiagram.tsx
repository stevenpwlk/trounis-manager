import type { FormationId } from "../../src/data/types";
import { SLOTS_BY_FORMATION } from "../../src/engine/formations";
import { FORMATION_LABELS } from "../trait-labels";

/** Coordonnées inventées (aucune donnée géométrique n'existe ailleurs dans le moteur) — un
 * schéma illustratif du bassin, pas une vraie carte tactique. */
const LAYOUTS: Record<FormationId, Array<[number, number]>> = {
  triangle: [[50, 22], [26, 78], [74, 78]],
  losange: [[50, 12], [18, 50], [82, 50], [50, 88]],
  libre: [[50, 14], [16, 42], [84, 42], [30, 86], [70, 86]],
  "carre-cercle": [[22, 22], [78, 22], [22, 78], [78, 78], [50, 50]],
};

export default function FormationDiagram({ formation }: { formation: FormationId }) {
  const points = LAYOUTS[formation];
  const pivotIndex = formation === "carre-cercle" ? points.length - 1 : -1;

  return (
    <div className="tutorial-diagram">
      <svg viewBox="0 0 100 100" className="tutorial-diagram__svg" aria-hidden="true">
        <rect x="4" y="4" width="92" height="92" rx="10" className="tutorial-diagram__pool" />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === pivotIndex ? 6 : 5}
            className={i === pivotIndex ? "tutorial-diagram__dot tutorial-diagram__dot--pivot" : "tutorial-diagram__dot"}
          />
        ))}
      </svg>
      <p className="tutorial-diagram__caption">
        {FORMATION_LABELS[formation]} — {SLOTS_BY_FORMATION[formation]} tireurs alignés{pivotIndex >= 0 ? " (dont 1 pivot)" : ""}
      </p>
    </div>
  );
}
