# Note du lot 77 : les mots et la charte

Branche `lot-77`, empilée sur `lot-75-76` (commit `3562d41`) : 10 commits,
dont deux de documentation, 38 fichiers de code, 396 lignes ajoutées, 251
retirées. Aucune migration, aucune dépendance nouvelle, aucune variable
d'environnement. À fusionner après `lot-75-76`, avec un commit de fusion.

## 2. Ce que la branche change

Tout vient de la revue de Cédric du 2 septembre, complétée le 8. Six choses,
toutes visibles, aucune structurelle.

1. **Cartes SONCAS et DISC** : seul le score sur 100 reste à côté de chaque
   levier et de chaque style. Les mots de tranche (absent, ténu, net, marqué,
   omniprésent) disparaissent, et `lib/profile-score-bands-fr.ts` avec eux.
   « Style dominant » devient « Style principal détecté », « Dominant
   prospect » devient « Levier principal détecté ». La règle de preuve ne
   bouge pas, elle est dite en une phrase.
2. **Charte** : `app/globals.css`, bloc `:root` seulement. « Ivoire et
   Encre » devient la charte froide de la maquette : papier `#f6f6fb`, encre
   `#0c0c14`, gris tirés vers le violet, colonne de navigation blanche avec
   l'entrée active sur `#f1edff`. Le bloc `.dark` est intact, la marque
   `#6c4dff` aussi.
3. **Formulaire de rendez-vous** : le champ « Étape pipeline » disparaît. La
   colonne reste en base ; à la modification d'un rendez-vous, un champ caché
   renvoie l'étape existante pour ne pas l'effacer. Les listes d'étapes
   restent disponibles dans les réglages et dans Préparer.
4. **Le commercial lit son SalesScore sur 100, la note sur 5 reste au
   manager.** `OrgAdminMonEquipeRow` porte un `salesScoreAvg` entier à côté
   de `noteGlobaleOn5`, `TeamMemberStanding` un `averageSalesScore`,
   `DashboardHomeFigures` un `salesScoreAvg` et un `salesScoreTrendPoints`.
   Les composants `TeamMemberStanding` et `AnalyseKpiCards` prennent une
   `echelle` (`sur5` ou `sur100`) que chaque écran fixe selon son lecteur ;
   le hero du commercial passe sur 100. Le rang, le palier et l'écart gardent
   leur calcul.
5. **Le bouton « Relancer l'analyse »** : rien à changer, il n'apparaît déjà
   que sur une analyse en échec ou bloquée, jamais sur un rendez-vous analysé.
   Noté ici pour que le point ne revienne pas.
6. **Vocabulaire** : « Où gagner des points » (ex « Points perdus »), « Notre
   suggestion » (ex « À dire à la place »), « Ce que cela traduit », « Ce
   qu'il vaut mieux éviter », « Analyser un rendez-vous » (ex « Nouveau
   rendez-vous »), « À accompagner en priorité », « Axe d'amélioration » (ex
   « À travailler »), « Compte rendu de visite », « Comment est-il utilisé »
   (aperçu du playbook), et les quatre cases KISS du tableau de bord manager
   écrites en français comme sur la fiche d'un rendez-vous.

## 3. Ce qui a été vérifié

Sur la branche telle quelle, dans l'environnement de Thomas, sans client Prisma :

- `npx eslint .` : 0 erreur.
- `npx jest` : 1 375 tests verts, 159 suites ; la seule suite en échec est
  toujours `tests/company-features.actions.test.ts`, qui importe le client
  Prisma impossible à générer ici (accès aux binaires Prisma bloqué). Elle
  passe après `npx prisma generate`.
- `npx tsc --noEmit` : 100 erreurs, exactement les mêmes qu'avant le lot,
  toutes dues au client Prisma absent. Attendu 0 après `prisma generate`.
- `cspell` : 98 mots inconnus, comme avant le lot.
- `tests/typographie.test.ts` : aucun tiret cadratin.

La séquence sur un poste avec accès aux binaires Prisma :

```bash
npx prisma generate
npm run verify        # typecheck + lint + tests
npm run build         # prisma migrate deploy puis next build
```

L'application n'a pas pu être lancée dans cet environnement, faute de client
Prisma : la charte et le hero sont vérifiés par le typage et les tests, pas
à l'écran. La recette se fait sur la prévisualisation Vercel de la branche,
avec `RECETTE-LOT-77.md`. Si une couleur paraît fausse, tout est dans le
bloc `:root` de `app/globals.css`.

## 4. Texte de la pull request

Titre :

```
Lot 77 : les mots et la charte de la revue du 2 septembre
```

Description :

```
Applique au code les décisions de la revue de Cédric du 2 septembre (complétée le 8) qui ne demandent aucune migration : les cartes SONCAS et DISC ne gardent que le score sur 100, la charte passe d'Ivoire et Encre à la charte froide de la maquette (bloc :root seulement), l'étape du pipeline sort du formulaire de rendez-vous, le commercial lit son SalesScore sur 100 pendant que le manager garde la note sur 5, et le vocabulaire de la revue remplace l'ancien partout où l'écran parle (Où gagner des points, Notre suggestion, Ce que cela traduit, Analyser un rendez-vous, À accompagner en priorité, Axe d'amélioration, Compte rendu de visite).

Aucune migration, aucune dépendance, aucune variable d'environnement. Un fichier supprimé : lib/profile-score-bands-fr.ts. Un fichier ajouté : lib/format-score-sur100.ts.

Vérifié : eslint 0, 1 375 tests verts, typographie sans tiret cadratin. Typecheck et build à confirmer après prisma generate.

Fusionner avec un commit de fusion, après lot-75-76.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Usf46TR18tCNNZ6PMAL6qK
```
