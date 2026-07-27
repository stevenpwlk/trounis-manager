function riskColor(risk: number): string {
  if (risk >= 0.18) return "var(--danger)";
  if (risk >= 0.08) return "var(--warn)";
  return "var(--ok)";
}

function RiskRow({ label, risk }: { label: string; risk: number }) {
  const pct = Math.round(risk * 100);
  const color = riskColor(risk);
  return (
    <div className="risk-row">
      <div className="risk-row__head">
        <span>{label}</span>
        <span style={{ color, fontFamily: "var(--data)" }}>{pct}%</span>
      </div>
      <div className="risk-row__track">
        <div className="risk-row__fill" style={{ width: `${Math.min(100, (risk / 0.35) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DisciplineRiskGauge({ ownRisk, opponentRisk }: { ownRisk: number; opponentRisk: number }) {
  return (
    <div className="risk-gauge">
      <RiskRow label="Votre risque de saisine" risk={ownRisk} />
      <RiskRow label="Risque adverse" risk={opponentRisk} />
    </div>
  );
}
