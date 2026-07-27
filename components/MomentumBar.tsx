/** Barre de momentum en direct (Lot 2, § demande Steven 2026-07-27) — reflète la VRAIE
 * valeur interne du moteur (MatchSession.getMomentum(), -100..100, signée côté domicile),
 * pas une animation de démo comme celle du tutoriel. */
export default function MomentumBar({
  momentum,
  leftLabel,
  rightLabel,
}: {
  momentum: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const clamped = Math.max(-100, Math.min(100, momentum));
  const leftWidth = 50 + clamped / 2;

  return (
    <div className="momentum-bar">
      <div className="momentum-bar__track">
        <div className="momentum-bar__seg momentum-bar__seg--left" style={{ flexBasis: `${leftWidth}%` }} />
        <div className="momentum-bar__seg momentum-bar__seg--right" style={{ flexBasis: `${100 - leftWidth}%` }} />
        <div className="momentum-bar__center" />
      </div>
      <div className="momentum-bar__labels">
        <span>{leftLabel}</span>
        <span>Momentum</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
