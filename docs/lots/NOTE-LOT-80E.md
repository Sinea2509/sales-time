# Note du lot 80e : le SalesScore sur la grille

Branche `lot-80e`, sur `main` après le lot 80d (101d030). Décision du
1er octobre : « SalesScore sur la grille », comme la maquette du 11
septembre l'annonce (« sur 100, grille rendez-vous de découverte »).

## 1. Ce que la branche change

- **Le SalesScore d'un rendez-vous est la note de sa grille**, sur 100
  (`overallScore` de l'analyse SCORECARD), là où il était la moyenne des six
  leviers SONCAS. La règle vit dans une seule fonction,
  `salesScoreForMeeting`, appelée aux deux endroits qui produisent un score :
  la fiche du rendez-vous et les lignes de rendez-vous de l'adaptateur Prisma
  (`listRecentMeetingsForDashboard`). Tout le reste (tableaux de bord,
  classement, paliers, moyennes à 30 jours, bilan du lundi, exports) lit ces
  lignes et change donc avec elles, sans autre modification.
- **Repli sur SONCAS** quand le rendez-vous n'a pas de note de grille : un
  type de rendez-vous sans grille (seule la découverte en a une), une analyse
  d'avant la grille, ou une grille illisible. Un rendez-vous analysé garde
  ainsi un score, et le classement ne perd personne.
- **Les textes** disent la nouvelle règle : la colonne de droite de la fiche
  (« La note de la grille, sur ses 25 critères. », ou « Sans grille pour ce
  type de rendez-vous : la moyenne des six leviers SONCAS. »), l'explication
  du tableau de bord du commercial, et la carte « Mon SalesScore détaillé »
  d'un type sans grille.

## 2. Ce qui change pour les utilisateurs

Les notes de tous les commerciaux changent : un rendez-vous de découverte
prend la note de sa grille, souvent très différente de la moyenne SONCAS (sur
le poste, le rendez-vous de test passe de 45 à 100). Les paliers (Démarrage,
Progression, Maîtrise, Excellence) et le classement suivent. Les
rendez-vous sans grille gardent leur note d'avant.

La maquette annonce aussi « ± 3 points de marge de reproductibilité ».
L'application ne calcule pas cette marge ; elle n'écrit donc rien de tel.

## 3. Ce qui a été vérifié

- `npm run verify` : tsc 0, eslint 0, 1 694 tests verts (191 suites), dont
  trois nouveaux : la note de la grille prime, le repli SONCAS sans grille
  ou grille illisible, `null` sans rien.
- `npm run spellcheck` : 0 mot inconnu dans le dépôt.
- Sur le poste, dans Chrome, base Neon `dev` : la fiche du rendez-vous de
  test affiche le SalesScore de sa grille et le texte « La note de la grille,
  sur ses 25 critères. » ; la liste des rendez-vous et le tableau de bord
  reprennent la nouvelle note.

## 4. Avant de fusionner

Aucune migration, aucune dépendance, aucune variable d'environnement. Les
notes affichées changent dès la mise en ligne, sans recalcul en base : le
score se lit dans les analyses déjà enregistrées.

## 5. Texte de la pull request

Titre :

```
Lot 80e : le SalesScore sur la grille
```

Description :

```
Le SalesScore d'un rendez-vous est désormais la note de sa grille, sur 100, comme l'annonce la maquette du 11 septembre ; la moyenne des six leviers SONCAS ne sert plus que de repli pour un rendez-vous sans grille. Une seule fonction, salesScoreForMeeting, aux deux endroits qui produisent un score (fiche, lignes de rendez-vous) ; tableaux de bord, classement, paliers et bilan du lundi suivent. Les textes disent la nouvelle règle.

Les notes de tous les commerciaux changent dès la mise en ligne, sans migration ni recalcul.

Vérifié : tsc 0, eslint 0, 1 694 tests verts, spellcheck 0, recette sur le poste (docs/lots/NOTE-LOT-80E.md, section 3).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
