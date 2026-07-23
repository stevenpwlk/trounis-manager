"use client";
import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../lib/game";
import { advanceJournee, currentFixture, recordPlayerMatch, simulateAiMatchesForJournee, applyWeeklyConditioning } from "../../lib/game";
import { getClub } from "../../src/data/clubs";
import type { MatchResult } from "../../src/engine/match";

export default function MatchSynthesis({
  game,
  setGame,
  opponent,
  result,
  lineupIds,
  onDone,
}: {
  game: GameState;
  setGame: (updater: (g: GameState) => GameState) => void;
  opponent: string;
  result: MatchResult;
  lineupIds: string[];
  onDone: (seasonFinished: boolean) => void;
}) {
  const [seasonFinished, setSeasonFinished] = useState(false);
  const applied = useRef(false);

  // Frozen at mount: `game` is still the parent's state, but the effect below
  // calls setGame (which advances journee), and the parent re-render that follows
  // would otherwise make currentFixture(game) resolve to the NEXT fixture instead
  // of the one just played, flipping which crest shows on which side.
  const [{ isHome }] = useState(() => {
    const fixture = currentFixture(game);
    return { isHome: fixture ? fixture.home === game.clubCode : true };
  });

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const home = isHome ? game.clubCode : opponent;
    const away = isHome ? opponent : game.clubCode;

    setGame((g) => {
      let next = simulateAiMatchesForJournee(g, g.journee);
      next = recordPlayerMatch(next, home, away, result);
      const roster = next.rosters[g.clubCode]!;
      const playedLineup = roster.filter((t) => lineupIds.includes(t.id));
      applyWeeklyConditioning(roster, playedLineup, g.restedTireurId, `${g.seed}-conditioning-${g.journee}`);
      next = advanceJournee(next);
      if (next.journee > 18) setSeasonFinished(true);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const club = getClub(game.clubCode);
  const opp = getClub(opponent);
  const dominantPeriod = [...result.periods].sort((a, b) => Math.abs(b.home - b.away) - Math.abs(a.home - a.away))[0];

  return (
    <section className="screen">
      <span className="eyebrow-label">Feuille homologuée</span>
      <h1 className="screen-title">Synthèse du match</h1>

      <div className="scorebug">
        <div className="scorebug__team"><span className="crest-badge">{isHome ? club.code : opp.code}</span><span className="scorebug__name">{isHome ? club.code : opp.code}</span></div>
        <div style={{ textAlign: "center" }}>
          <span className="scorebug__score">{result.homeScore}</span>–<span className="scorebug__score">{result.awayScore}</span>
          <span className="scorebug__period">{result.homeScore === result.awayScore ? "Nul" : "Terminé"}</span>
        </div>
        <div className="scorebug__team right"><span className="crest-badge">{isHome ? opp.code : club.code}</span><span className="scorebug__name">{isHome ? opp.code : club.code}</span></div>
      </div>

      <div className="panel">
        <h3>Duels période par période</h3>
        {result.periods.map((p) => (
          <div className="row" key={p.period}>
            <span style={{ fontSize: ".78rem" }}>Période {p.period}</span>
            <span className="pill pill--muted">{p.home} - {p.away}</span>
          </div>
        ))}
      </div>

      {dominantPeriod && (
        <div className="panel">
          <h3>Moment clé</h3>
          <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>
            Le plus gros écart de période a eu lieu en période {dominantPeriod.period} ({dominantPeriod.home}-{dominantPeriod.away}).
            {result.milestones.length > 0 && ` Milestones : ${result.milestones.join(", ")}.`}
          </p>
        </div>
      )}

      {result.saisines.length > 0 && (
        <div className="panel">
          <h3>Discipline</h3>
          <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>{result.saisines.length} saisine(s) du Conseil ce match.</p>
        </div>
      )}

      <button className="btn btn--primary" onClick={() => onDone(seasonFinished)}>
        {seasonFinished ? "Voir le bilan de saison →" : "Retour au tableau de bord"}
      </button>
    </section>
  );
}
