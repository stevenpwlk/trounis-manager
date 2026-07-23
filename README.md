# Trounis Manager — Moteur (P1)

Librairie TypeScript déterministe du jeu 2 de l'écosystème Trounis. Phase
**P1 du plan de conception** (`~/.claude/plans/trounis-manager-conception-managerial-anchovy.md`) :
le moteur seul, sans habillage, testé en console avant toute UI — le risque
principal du projet (si le moteur n'est pas équilibré, rien construit
par-dessus n'a de sens).

## Structure

```
src/data/       clubs.ts, types.ts, roster-names.ts (200 noms, §33),
                stars.ts (16 stars canoniques, §17), traits.ts (24 traits, §15),
                roster.ts (génération d'effectif)
src/engine/     rng.ts (mulberry32 seedé), formations.ts, tactics.ts, bassin.ts,
                match.ts (moteur par périodes), schedule.ts (calendrier
                round-robin), standings.ts, season.ts (saison + barrage),
                cup.ts (Coupe de la F.I.S.T.)
src/sim/        scripts de rapport (lisibles en console)
test/           suite vitest (64 tests)
```

## Commandes

```bash
npm test               # suite de tests complète
npm run sim:season     # une saison détaillée (standings, barrage, Coupe, un match commenté)
npm run sim:balance    # agrégat sur N saisons (par défaut 100 ; passer un nombre en argument)
npm run sim:formations # écart de performance par club selon la formation active
```

## Calibrage (§16) — état actuel

Constantes de résolution de période, dans `src/engine/match.ts` :
- Base : 14 points/période, edge scaling ×0,45, bruit ±4,5×varianceMult.
- Calé pour retomber sur des totaux de match proches du canon (moyenne ~111,
  médiane 111, canon réel ~93-164).

**Constat de calibrage à noter** : sur 150 saisons simulées avec IA par
défaut (aucune décision humaine — formations/tactiques/entraînement/mercato
ne sont PAS encore un levier testé ici), les 3 clubs les plus forts
(Goudufist/Makitouffe/Njordifles) remportent ~97 % des titres de L1 ; aucun
club classé 4e-10e en force ne gagne sur l'échantillon. C'est cohérent avec
« difficulté = le club » (plan §8) et le fait que les leviers d'équilibrage
réels (entraînement, mercato, choix tactiques par match) n'existent pas
encore dans ce moteur nu — mais mérite d'être re-testé une fois P2 (la
boucle jouable) ajoute la couche de décision humaine.

## Ce qui n'est PAS dans ce moteur (hors périmètre P1)

Vieillissement/retraite pluriannuel, Vivier, mercato IA, carrière manager,
Panthéon, succès — tout ça est P3 (§34 du plan). P1 génère un effectif frais
à chaque saison simulée, sans persistance inter-saison.
