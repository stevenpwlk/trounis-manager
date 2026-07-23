/** Fichier d'écusson (public/emblems/*.webp) par code de club. */
export const CREST_FILE_BY_CODE: Record<string, string> = {
  GOU: "goudufist",
  NJO: "njordifles",
  SIL: "sillon",
  MAK: "makitouffe",
  CCG: "cavite-geneve",
  PAP: "paprika-united",
  ABR: "anchois-brestois",
  SAL: "salinite-sc",
  KRA: "kraken-oslo",
  HOU: "la-houle",
  CAV: "cavitadors-veracruz",
  APS: "apnee-serein",
  FJO: "fjordstrom-malmo",
  VOR: "vortex-bilbao",
  ATL: "atlantes-porto",
  COR: "corallium-split",
  POS: "poseidon-athina",
  WAV: "wavebreak-dublin",
  NAP: "cavite-napoli",
  ALB: "anchois-albion",
};

export function crestSrc(code: string): string | null {
  const file = CREST_FILE_BY_CODE[code];
  return file ? `/emblems/${file}.webp` : null;
}
