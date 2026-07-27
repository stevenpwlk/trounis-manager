import { ATTR_COLOR } from "./attrColors";

export default function CiblageVerdict({ opponentApnee, willTrigger }: { opponentApnee: number; willTrigger: boolean }) {
  return (
    <div className="ciblage-verdict">
      <span>
        Apnée adverse : <strong style={{ color: ATTR_COLOR.apnee }}>{opponentApnee.toFixed(1)}</strong>
      </span>
      <span className={`pill ${willTrigger ? "pill--ok" : "pill--muted"}`}>
        {willTrigger ? "Ça va marcher (+10%)" : "Sans effet"}
      </span>
    </div>
  );
}
