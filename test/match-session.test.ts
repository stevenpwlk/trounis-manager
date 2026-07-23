import { describe, it, expect } from "vitest";
import { createRng } from "../src/engine/rng";
import { MatchSession, simulateMatch } from "../src/engine/match";
import { generateClubRoster } from "../src/data/roster";
import { DEFAULT_CONSIGNES } from "../src/data/types";
import type { ConditionsBassin, Consignes, Tireur } from "../src/data/types";

const NEUTRAL: ConditionsBassin = { salinite: "moyenne", paprika: "faible", risqueMarin: "faible" };

function roster(club: string, seed: string): Tireur[] {
  return generateClubRoster(club, createRng(seed));
}

describe("MatchSession — sans intervention, doit reproduire exactement simulateMatch", () => {
  it("playNextPeriod() x4 sans changement de consignes == simulateMatch()", () => {
    const home = roster("GOU", "session-parity-home");
    const away = roster("NJO", "session-parity-away");

    const atomic = simulateMatch({
      homeRoster: home,
      awayRoster: away,
      formation: "losange",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-parity"),
    });

    const session = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "losange",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-parity"),
    });
    while (!session.isFinished()) session.playNextPeriod();

    expect(session.getResult()).toEqual(atomic);
  });
});

describe("MatchSession — intervention à la mi-temps/temps mort", () => {
  it("joue période par période : le score ne progresse qu'après playNextPeriod()", () => {
    const home = roster("SIL", "session-progress-home");
    const away = roster("MAK", "session-progress-away");
    const session = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "triangle",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-progress"),
    });

    expect(session.period).toBe(0);
    expect(session.isFinished()).toBe(false);

    session.playNextPeriod();
    expect(session.period).toBe(1);
    expect(session.periods).toHaveLength(1);
    expect(session.isFinished()).toBe(false);

    session.playNextPeriod();
    session.playNextPeriod();
    session.playNextPeriod();
    expect(session.period).toBe(4);
    expect(session.isFinished()).toBe(true);
  });

  it("playNextPeriod() au-delà de la 4e période ne fait rien (idempotent)", () => {
    const home = roster("PAP", "session-overplay-home");
    const away = roster("ABR", "session-overplay-away");
    const session = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "libre",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-overplay"),
    });
    for (let i = 0; i < 4; i++) session.playNextPeriod();
    const resultBefore = session.getResult();
    session.playNextPeriod();
    session.playNextPeriod();
    expect(session.getResult()).toEqual(resultBefore);
  });

  it("changer les consignes à la mi-temps influence bien les périodes suivantes", () => {
    const home = roster("KRA", "session-halftime-home");
    const away = roster("HOU", "session-halftime-away");

    const offensif: Consignes = { tempo: "offensif", ciblage: "tenir-cavite", discipline: "jouer-propre" };
    const prudent: Consignes = { tempo: "prudent", ciblage: "tenir-cavite", discipline: "jouer-propre" };

    // Session A : reste prudent tout le match
    const sessionA = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "carre-cercle",
      homeConsignes: prudent,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-halftime-switch"),
    });
    sessionA.playNextPeriod();
    sessionA.playNextPeriod();
    const scoreAtHalftimeA = sessionA.getScore();
    sessionA.playNextPeriod();
    sessionA.playNextPeriod();
    const secondHalfHomeA = sessionA.getScore().home - scoreAtHalftimeA.home;

    // Session B : même seed, mais passe en offensif à la mi-temps
    const sessionB = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "carre-cercle",
      homeConsignes: prudent,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-halftime-switch"),
    });
    sessionB.playNextPeriod();
    sessionB.playNextPeriod();
    const scoreAtHalftimeB = sessionB.getScore();
    sessionB.setConsignes("home", offensif);
    sessionB.playNextPeriod();
    sessionB.playNextPeriod();
    const secondHalfHomeB = sessionB.getScore().home - scoreAtHalftimeB.home;

    // Même seed, même 1ère mi-temps
    expect(scoreAtHalftimeA).toEqual(scoreAtHalftimeB);
    // La 2e mi-temps offensive doit rapporter plus de points que la prudente
    expect(secondHalfHomeB).toBeGreaterThan(secondHalfHomeA);
  });

  it("un changement de consignes ne modifie jamais les périodes déjà jouées", () => {
    const home = roster("VOR", "session-immutable-home");
    const away = roster("ATL", "session-immutable-away");
    const session = new MatchSession({
      homeRoster: home,
      awayRoster: away,
      formation: "losange",
      homeConsignes: DEFAULT_CONSIGNES,
      awayConsignes: DEFAULT_CONSIGNES,
      conditions: NEUTRAL,
      rng: createRng("session-immutable"),
    });
    session.playNextPeriod();
    session.playNextPeriod();
    const periodsBefore = [...session.periods];
    session.setConsignes("home", { tempo: "offensif", ciblage: "cibler-apnee", discipline: "provoquer" });
    expect(session.periods).toEqual(periodsBefore);
  });
});
