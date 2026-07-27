import type { AttrKey } from "../../src/data/types";

/**
 * Couleur distincte par attribut (§ demande Steven 2026-07-27 : "une couleur par attribut"
 * pour le pilote plus ludique/coloré des schémas dynamiques) — cantonné à ces nouveaux
 * composants d'aperçu, ne touche pas le reste de l'identité visuelle existante (chantier de
 * refonte globale explicitement repoussé à plus tard).
 */
export const ATTR_COLOR: Record<AttrKey, string> = {
  cavite: "#f2665c",
  apnee: "#4fb3ff",
  anchois: "#c77dff",
  discipline: "#f4d35e",
  souffle: "#3ddc97",
};
