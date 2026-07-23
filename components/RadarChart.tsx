import { ATTR_KEYS } from "../src/data/types";
import type { Attributes } from "../src/data/types";

/** Petit radar SVG à 5 axes (Cavité/Apnée/Anchois/Discipline/Souffle), échelle 1-20. */
export default function RadarChart({ attrs, size = 120 }: { attrs: Attributes; size?: number }) {
  const cx = 100;
  const cy = 95;
  const maxR = 78;

  function pointAt(index: number, valueFraction: number): [number, number] {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
    const r = maxR * valueFraction;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const outline = ATTR_KEYS.map((_, i) => pointAt(i, 1).join(",")).join(" ");
  const midline = ATTR_KEYS.map((_, i) => pointAt(i, 0.55).join(",")).join(" ");
  const vertices = ATTR_KEYS.map((k, i) => pointAt(i, Math.min(attrs[k] / 20, 1)));
  const shape = vertices.map((p) => p.join(",")).join(" ");
  const spokes = ATTR_KEYS.map((_, i) => pointAt(i, 1));

  return (
    <svg viewBox="0 0 200 190" width={size} height={size * (190 / 200)}>
      <polygon points={outline} fill="none" stroke="#2a3568" strokeWidth="1" />
      <polygon points={midline} fill="none" stroke="#2a3568" strokeWidth="1" />
      {spokes.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2a3568" strokeWidth="1" />
      ))}
      <polygon points={shape} fill="rgba(201,164,92,.28)" stroke="#c9a45c" strokeWidth="2" />
      {vertices.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill="#e0c07f" stroke="#0a1128" strokeWidth="1" />
      ))}
    </svg>
  );
}
