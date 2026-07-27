import type { AttrKey } from "../../src/data/types";
import { DIMINISHING_RETURNS_THRESHOLD } from "../../src/engine/training";
import { ATTR_LABELS } from "../trait-labels";
import { ATTR_COLOR } from "./attrColors";

export default function TrainingProjection({
  attr,
  current,
  projected,
  subject,
}: {
  attr: AttrKey;
  current: number;
  projected: number;
  subject: string;
}) {
  const color = ATTR_COLOR[attr];
  const capped = current >= DIMINISHING_RETURNS_THRESHOLD;
  return (
    <div className="training-projection">
      <span className="training-projection__subject">{subject}</span>
      <span className="training-projection__values">
        <strong style={{ color }}>{ATTR_LABELS[attr]}</strong> {current.toFixed(1)} → <strong>{projected.toFixed(1)}</strong>
      </span>
      {capped && <span className="training-projection__note">Rendement réduit (passé {DIMINISHING_RETURNS_THRESHOLD}/20)</span>}
    </div>
  );
}
