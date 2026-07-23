import { describe, it, expect } from "vitest";
import { createRng } from "../src/engine/rng";
import { simulateMatch, pickLineup } from "../src/engine/match";
import { SLOTS_BY_FORMATION } from "../src/engine/formations";
import { generateClubRoster } from "../src/data/roster";
import { DEFAULT_CONSIGNES } from "../src/data/types";
import type { ConditionsBassin, Consignes, FormationId, Tireur } from "../src/data/types";

const NEUTRAL_BASSIN: ConditionsBassin = { salinite: "moyenne", paprika: "faible", risqueMarin: "faible" };

function roster(club: string, seed: string): Tireur[] {
  return generateClubRoster(club, createRng(seed));
}

function playMany(
  home: Tireur[],
  away: Tireur[],
  formation: FormationId,
  trials: number,
  opts?: { homeConsignes?: Consignes; awayConsignes?: Consignes; bassin?: ConditionsBassin }
) {
  const results = [];
  for (let i = 0; i < trials; i++) {
    results.push(
      simulateMatch({
        homeRoster: home,
        awayRoster: away,
        formation,
        homeConsignes: opts?.homeConsignes ?? DEFAULT_CONSIGNES,
        awayConsignes: opts?.awayConsignes ?? DEFAULT_CONSIGNES,
        conditions: opts?.bassin ?? NEUTRAL_BASSIN,
        rng: createRng(`trial-${formation}-${i}-${JSON.stringify(opts ?? {})}`),
      })
    );
  }
  return results;
}

describe("pickLineup", () => {
  it("aligne le bon nombre de tireurs par formation (§5)", () => {
    const r = roster("GOU", "lineup-count");
    for (const formation of ["triangle", "losange", "libre", "carre-cercle"] as FormationId[]) {
      expect(pickLineup(r, formation)).toHaveLength(SLOTS_BY_FORMATION[formation]);
    }
  });
});

describe("simulateMatch — sanité de base", () => {
  it("est déterministe : même seed + mêmes paramètres -> même résultat", () => {
    const home = roster("GOU", "det-home");
    const away = roster("NJO", "det-away");
    const run = () =>
      simulateMatch({
        homeRoster: home,
        awayRoster: away,
        formation: "losange",
        homeConsignes: DEFAULT_CONSIGNES,
        awayConsignes: DEFAULT_CONSIGNES,
        conditions: NEUTRAL_BASSIN,
        rng: createRng("match-determinism"),
      });
    expect(run()).toEqual(run());
  });

  it("produit toujours exactement 4 lignes de période", () => {
    const home = roster("SIL", "p-home");
    const away = roster("MAK", "p-away");
    const result = simulateMatch({
      homeRoster: home,
      awayRoster: away,
      formation: "triangle",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL_BASSIN,
      rng: createRng("period-count"),
    });
    expect(result.periods).toHaveLength(4);
    expect(result.periods.map((p) => p.period)).toEqual([1, 2, 3, 4]);
  });

  it("le score final est la somme exacte des points de période", () => {
    const home = roster("CCG", "sum-home");
    const away = roster("PAP", "sum-away");
    for (const result of playMany(home, away, "libre", 30)) {
      const sumHome = result.periods.reduce((s, p) => s + p.home, 0);
      const sumAway = result.periods.reduce((s, p) => s + p.away, 0);
      expect(result.homeScore).toBe(sumHome);
      expect(result.awayScore).toBe(sumAway);
    }
  });

  it("les scores par équipe restent dans une plage plausible sur 500 matchs (proche du canon ~15-90, jamais négatif)", () => {
    const home = roster("KRA", "plausible-home");
    const away = roster("HOU", "plausible-away");
    const results = playMany(home, away, "carre-cercle", 500);
    const scores = results.flatMap((r) => [r.homeScore, r.awayScore]);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(8);
      expect(s).toBeLessThanOrEqual(95);
    }
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(mean).toBeGreaterThan(25);
    expect(mean).toBeLessThan(65);
  });

  it("jamais plus d'une saisine par équipe par match, sur 500 matchs", () => {
    const home = roster("VOR", "saisine-home");
    const away = roster("ATL", "saisine-away");
    for (const result of playMany(home, away, "carre-cercle", 500, {
      homeConsignes: { tempo: "offensif", ciblage: "cibler-apnee", discipline: "provoquer" },
      awayConsignes: { tempo: "offensif", ciblage: "cibler-apnee", discipline: "provoquer" },
    })) {
      const homeSaisines = result.saisines.filter((s) => s.side === "home").length;
      const awaySaisines = result.saisines.filter((s) => s.side === "away").length;
      expect(homeSaisines).toBeLessThanOrEqual(1);
      expect(awaySaisines).toBeLessThanOrEqual(1);
    }
  });

  it("le momentum final reste toujours dans [-100,100]", () => {
    const home = roster("WAV", "momentum-home");
    const away = roster("NAP", "momentum-away");
    for (const result of playMany(home, away, "libre", 300)) {
      expect(result.finalMomentum).toBeGreaterThanOrEqual(-100);
      expect(result.finalMomentum).toBeLessThanOrEqual(100);
    }
  });

  it("les bonus anchois valent toujours exactement +1 et sont cohérents avec le score", () => {
    const home = roster("ABR", "anchois-home"); // club à fort anchois (star Alain Chovy)
    const away = roster("ALB", "anchois-away");
    for (const result of playMany(home, away, "losange", 100)) {
      const anchoisEvents = result.events.filter((e) => e.kind === "anchois");
      for (const ev of anchoisEvents) {
        expect(Math.abs(ev.homeDelta) + Math.abs(ev.awayDelta)).toBe(1);
      }
    }
  });
});

describe("simulateMatch — les formations créent des écarts (§16, critère d'acceptation P1)", () => {
  it("un effectif à dominante cavité/apnée performe mieux en Triangle qu'en Libre face au même adversaire", () => {
    // Effectif synthétique "spécialiste printemps" : cavité/apnée élevés, souffle faible.
    const specialist = makeSyntheticRoster({ cavite: 18, apnee: 18, anchois: 8, discipline: 10, souffle: 8 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffTriangle = averageDiff(specialist, baseline, "triangle", 400);
    const diffLibre = averageDiff(specialist, baseline, "libre", 400);

    expect(diffTriangle).toBeGreaterThan(diffLibre);
  });

  it("un effectif à dominante souffle performe mieux en Libre qu'en Triangle face au même adversaire", () => {
    const specialist = makeSyntheticRoster({ cavite: 10, apnee: 10, anchois: 10, discipline: 10, souffle: 19 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffLibre = averageDiff(specialist, baseline, "libre", 400);
    const diffTriangle = averageDiff(specialist, baseline, "triangle", 400);

    expect(diffLibre).toBeGreaterThan(diffTriangle);
  });

  it("un effectif à dominante discipline/apnée performe mieux en Carré-en-cercle qu'en Losange", () => {
    const specialist = makeSyntheticRoster({ cavite: 8, apnee: 17, anchois: 8, discipline: 19, souffle: 10 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffCarre = averageDiff(specialist, baseline, "carre-cercle", 400);
    const diffLosange = averageDiff(specialist, baseline, "losange", 400);

    expect(diffCarre).toBeGreaterThan(diffLosange);
  });

  it("un effectif à dominante anchois performe mieux en Losange qu'en Triangle", () => {
    const specialist = makeSyntheticRoster({ cavite: 10, apnee: 10, anchois: 19, discipline: 10, souffle: 10 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffLosange = averageDiff(specialist, baseline, "losange", 400);
    const diffTriangle = averageDiff(specialist, baseline, "triangle", 400);

    expect(diffLosange).toBeGreaterThan(diffTriangle);
  });
});

describe("simulateMatch — conditions de bassin (§14.1-a)", () => {
  it("un paprika élevé réduit l'avantage d'un effectif à dominante cavité", () => {
    const caviteHeavy = makeSyntheticRoster({ cavite: 19, apnee: 10, anchois: 10, discipline: 10, souffle: 10 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffNoPaprika = averageDiff(caviteHeavy, baseline, "losange", 400, { paprika: "faible", salinite: "moyenne", risqueMarin: "faible" });
    const diffHighPaprika = averageDiff(caviteHeavy, baseline, "losange", 400, { paprika: "eleve", salinite: "moyenne", risqueMarin: "faible" });

    expect(diffHighPaprika).toBeLessThan(diffNoPaprika);
  });

  it("une salinité élevée renforce l'avantage d'un effectif à dominante apnée", () => {
    const apneeHeavy = makeSyntheticRoster({ cavite: 10, apnee: 19, anchois: 10, discipline: 10, souffle: 10 });
    const baseline = makeSyntheticRoster({ cavite: 12, apnee: 12, anchois: 12, discipline: 12, souffle: 12 });

    const diffLow = averageDiff(baseline, apneeHeavy, "losange", 400, { paprika: "faible", salinite: "faible", risqueMarin: "faible" });
    const diffHigh = averageDiff(baseline, apneeHeavy, "losange", 400, { paprika: "faible", salinite: "elevee", risqueMarin: "faible" });

    // baseline vs apnee-heavy : l'écart (baseline - apnee_heavy) doit devenir PLUS négatif
    // (apnee_heavy gagne plus largement) quand la salinité monte.
    expect(diffHigh).toBeLessThan(diffLow);
  });
});

describe("simulateMatch — consignes tactiques (§16)", () => {
  it("le tempo offensif augmente le score marqué en moyenne par rapport au tempo prudent", () => {
    const home = roster("SAL", "tempo-home");
    const away = roster("COR", "tempo-away");

    const offensif = playMany(home, away, "losange", 400, {
      homeConsignes: { tempo: "offensif", ciblage: "tenir-cavite", discipline: "jouer-propre" },
    });
    const prudent = playMany(home, away, "losange", 400, {
      homeConsignes: { tempo: "prudent", ciblage: "tenir-cavite", discipline: "jouer-propre" },
    });

    const meanHomeOffensif = offensif.reduce((s, r) => s + r.homeScore, 0) / offensif.length;
    const meanHomePrudent = prudent.reduce((s, r) => s + r.homeScore, 0) / prudent.length;
    expect(meanHomeOffensif).toBeGreaterThan(meanHomePrudent);
  });

  it("« provoquer » augmente le risque de saisine adverse par rapport à « jouer propre »", () => {
    const home = roster("POS", "provoke-home");
    const away = roster("WAV", "provoke-away");

    const provoking = playMany(home, away, "carre-cercle", 600, {
      homeConsignes: { tempo: "equilibre", ciblage: "tenir-cavite", discipline: "provoquer" },
    });
    const clean = playMany(home, away, "carre-cercle", 600, {
      homeConsignes: { tempo: "equilibre", ciblage: "tenir-cavite", discipline: "jouer-propre" },
    });

    const awaySaisinesProvoking = provoking.reduce((s, r) => s + r.saisines.filter((x) => x.side === "away").length, 0);
    const awaySaisinesClean = clean.reduce((s, r) => s + r.saisines.filter((x) => x.side === "away").length, 0);
    expect(awaySaisinesProvoking).toBeGreaterThan(awaySaisinesClean);
  });
});

describe("simulateMatch — milestones (§16 momentum)", () => {
  it("détecte au moins un lead_change/equalizer sur un échantillon de matchs serrés", () => {
    const home = roster("VOR", "milestone-home");
    const away = roster("ATL", "milestone-away");
    const results = playMany(home, away, "libre", 200);
    const anyMilestones = results.some((r) => r.milestones.length > 0);
    expect(anyMilestones).toBe(true);
  });
});

// ---- Fixtures synthétiques pour les tests de différenciation de formation ----

function makeSyntheticRoster(attrs: Tireur["attrs"]): Tireur[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `synthetic-${i}`,
    name: `Synthétique ${i}`,
    clubCode: "TEST",
    age: 26,
    attrs: { ...attrs },
    trait: "silencieux-redoutable" as const,
    isStar: false,
    forme: 100,
  }));
}

/** Moyenne de (score A - score B) sur N matchs A(domicile) vs B(extérieur). */
function averageDiff(
  a: Tireur[],
  b: Tireur[],
  formation: FormationId,
  trials: number,
  bassin: ConditionsBassin = NEUTRAL_BASSIN
): number {
  const results = playMany(a, b, formation, trials, { bassin });
  return results.reduce((s, r) => s + (r.homeScore - r.awayScore), 0) / results.length;
}
