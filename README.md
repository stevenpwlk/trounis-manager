# Trounis Manager

Jeu 2 de l'écosystème Trounis — un manager de tir de précision aquatique
(la « Cavité »), conçu dans `~/.claude/plans/trounis-manager-conception-managerial-anchovy.md`.
**En ligne sur [manager.trounis.fr](https://manager.trounis.fr).**

Trounis Manager vit entièrement en ligne : connexion obligatoire avec un
compte Trounis existant (même écosystème que les pronos et Cavity Game),
3 emplacements de sauvegarde synchronisés en base — aucun état de partie ne
vit uniquement dans le navigateur.

## Structure

```
src/data/       clubs.ts, types.ts, roster-names.ts (200 noms, §33),
                stars.ts (16 stars canoniques, §17), traits.ts (24 traits, §15),
                roster.ts (génération d'effectif), crests.ts, depeches.ts
src/engine/     rng.ts (mulberry32 seedé), formations.ts, tactics.ts, bassin.ts,
                match.ts (moteur par périodes + MatchSession pilotable),
                schedule.ts (calendrier round-robin), standings.ts,
                season.ts (saison + barrage), cup.ts (Coupe de la F.I.S.T.),
                training.ts, mercato.ts, objective.ts
src/sim/        scripts de rapport (lisibles en console, IA-vs-IA)
test/           suite vitest (96 tests)
app/, components/   app Next.js 15 / React 19 — la boucle jouable (P2)
lib/game.ts     orchestration d'une saison (fixtures, standings, dépêches,
                barrage, Coupe, IA d'entraînement des 19 autres clubs)
lib/supabase/   client navigateur + sauvegarde cloud (3 emplacements)
supabase/migrations/   schéma manager_saves (RLS par utilisateur)
public/emblems/ 20 écussons de club (WebP)
```

## Commandes

```bash
npm run dev            # app Next.js en local (nécessite .env.local, cf. .env.example)
npm test                # suite de tests complète
npm run sim:season       # une saison détaillée (standings, barrage, Coupe, un match commenté)
npm run sim:balance      # agrégat sur N saisons (par défaut 100 ; passer un nombre en argument)
npm run sim:formations   # écart de performance par club selon la formation active
```

## Calibrage (§16) — état actuel

Constantes de résolution de période, dans `src/engine/match.ts` :
- Base : 14 points/période, edge scaling ×0,45, bruit ±4,5×varianceMult.
- Calé pour retomber sur des totaux de match proches du canon (moyenne ~111,
  médiane 111, canon réel ~93-164).

**Constat de calibrage (P1, toujours valable)** : sur 150 saisons simulées
IA-vs-IA (sans décision humaine), les 3 clubs les plus forts remportent
~97 % des titres de L1 ; aucun club classé 4e-10e en force n'en gagne un
seul. Cohérent avec « difficulté = le club » (plan §8) — tranché : ne pas
resserrer l'écart de force au niveau du moteur, le vrai levier est humain
(entraînement/tactiques/mercato, ajoutés en P2).

## Phases livrées

- **P1** — le moteur, sans habillage.
- **P2** — la boucle jouable solo : entraînement, mercato, composition,
  match en direct (mi-temps + temps mort + « simuler la fin »), bilan de
  saison complet (barrage + Coupe de la F.I.S.T. simulée), dépêches
  narratives légères (Gazette du Bassin), IA d'entraînement pour les 19
  autres clubs.
- **P2.5** — refonte visuelle (polices réelles, vrais écussons, bottom
  sheet), passage en persistance 100 % en ligne (Supabase, 3 emplacements
  par compte, connexion obligatoire).

## Ce qui reste (P3 et au-delà)

Vieillissement/retraite pluriannuel, Vivier, mercato IA entre les 19 autres
clubs (nécessite un écran de scouting adverse), carrière manager, Panthéon,
succès, Coupe de la F.I.S.T. jouée interactivement (aujourd'hui simulée en
bloc en fin de saison) — voir §34/P3 du plan.
