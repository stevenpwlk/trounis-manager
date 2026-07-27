"use client";
import { useEffect, useState } from "react";
import { TUTORIAL_MOMENTS, type TutorialMomentId } from "./tutorialContent";
import FormationDiagram from "./FormationDiagram";
import MomentumDemo from "./MomentumDemo";
import type { FormationId } from "../../src/data/types";

type Spotlight = { top: number; left: number; width: number; height: number };

export default function TutorialOverlay({
  activeId,
  formation,
  onDismiss,
  onSkipAll,
}: {
  activeId: TutorialMomentId | null;
  formation: FormationId;
  onDismiss: () => void;
  onSkipAll: () => void;
}) {
  const moment = activeId ? TUTORIAL_MOMENTS[activeId] : null;
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  useEffect(() => {
    if (!moment?.target) {
      setSpotlight(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-tutorial-target="${moment.target}"]`);
      if (!el) {
        setSpotlight(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setSpotlight({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    };
    update();
    window.addEventListener("resize", update);
    // capture:true — le scroll se produit sur le conteneur interne `.screen`, qui ne fait pas
    // remonter l'événement en bubble ; seule la phase de capture depuis window l'intercepte.
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [moment]);

  if (!moment) return null;

  return (
    <>
      {spotlight ? <div className="tutorial-spotlight" style={spotlight} /> : <div className="tutorial-backdrop" />}
      <div className="tutorial-card dossier">
        <div className="dossier__ref">{moment.eyebrow}</div>
        <h3>{moment.title}</h3>
        {moment.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {moment.diagram === "formations" && <FormationDiagram formation={formation} />}
        {moment.diagram === "momentum" && <MomentumDemo />}
        <div className="sheet-actions" style={{ marginTop: 12 }}>
          {moment.offerSkipAll && (
            <button className="btn btn--ghost btn--sm" onClick={onSkipAll}>
              Passer le tutoriel
            </button>
          )}
          <button className="btn btn--primary btn--sm" onClick={onDismiss}>
            Compris
          </button>
        </div>
      </div>
    </>
  );
}
