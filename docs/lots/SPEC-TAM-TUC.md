# Sales Time : le temps administratif gagné (TAM) et le taux d'utilisation (TUC)

Spécification des deux indicateurs demandés à la revue du 2 septembre. La
première partie se lit sans être développeur, la seconde est pour Stéphane.

## 1. Ce que les deux chiffres veulent dire

**Le TAM** répond à la question « combien de temps Sales Time m'a fait gagner ».
Il s'exprime en heures et minutes, sur la période affichée (30 jours par
défaut). Il ne juge pas la qualité des rendez-vous : un rendez-vous raté
analysé fait gagner autant de temps de rédaction qu'un rendez-vous réussi.

**Le TUC** répond à la question « est-ce que j'utilise l'outil autant que mon
équipe ». Il s'exprime en pourcentage, de 0 à 100. Il compare le commercial à
la moyenne de son équipe. Il est recalculé une fois par semaine, le lundi, et
l'écran le dit.

Les deux portent un bouton « comment c'est calculé », avec le texte ci-dessous.

## 2. Le TAM : un temps fixe par action

Décision de Thomas : un temps fixe par action, indépendant de la longueur du
transcript. Ce qui est produit est réputé utilisé, on ne trace pas les clics
sur « copier ».

| Action                                  | Temps compté | Pourquoi ce chiffre                       |
| --------------------------------------- | ------------ | ----------------------------------------- |
| Une analyse de rendez-vous terminée     | 45 minutes   | réécouter, trier, rédiger le compte rendu |
| L'e-mail de suivi généré avec l'analyse | 15 minutes   | rédiger, relire, envoyer                  |

Chaque analyse terminée produit son e-mail, donc en pratique :

**TAM = nombre d'analyses terminées sur la période × 60 minutes.**

Exemple : 9 rendez-vous analysés sur 30 jours donnent 9 heures. L'écran
affiche « 9 h », et en dessous l'écart avec la période précédente, « +2 h vs
30 jours précédents », en vert si positif.

Les deux constantes, 45 et 15, sont des réglages du produit, pas de
l'organisation : elles ne s'éditent pas dans l'interface pour le premier
lancement.

## 3. Le TUC : trois critères, un barème, un calcul par semaine

### Pourquoi pas les trois critères cités à la revue

La revue citait le SalesScore, le TAM et le nombre de rendez-vous analysés.
Avec un TAM à temps fixe, le TAM vaut exactement « nombre d'analyses × 60 » :
comparer les deux à la moyenne reviendrait à compter deux fois la même chose.
Le troisième critère devient donc la **régularité**, qui mesure autre chose :
un commercial qui analyse ses rendez-vous chaque semaine utilise mieux l'outil
que celui qui en analyse dix d'un coup le dernier jour du mois.

### Les trois critères

| Critère                                                              | Points maximum | Comparé à quoi         |
| -------------------------------------------------------------------- | -------------- | ---------------------- |
| SalesScore moyen sur 30 jours                                        | 40             | la moyenne de l'équipe |
| Rendez-vous analysés sur 30 jours                                    | 35             | la moyenne de l'équipe |
| Régularité : semaines avec au moins une analyse, sur les 4 dernières | 25             | un barème fixe         |

### Le barème des deux critères comparés à l'équipe

L'écart est calculé en pourcentage de la moyenne : (valeur du commercial
moins moyenne) divisé par la moyenne.

| Écart à la moyenne de l'équipe  | Part des points |
| ------------------------------- | --------------- |
| +15 % et plus                   | 100 %           |
| de +5 % à +15 %                 | 75 %            |
| de -5 % à +5 %, dans la moyenne | 50 %            |
| de -15 % à -5 %                 | 30 %            |
| de -30 % à -15 %                | 15 %            |
| en dessous de -30 %             | 0 %             |

### Le barème de la régularité

| Semaines actives sur les 4 dernières | Points |
| ------------------------------------ | ------ |
| 4                                    | 25     |
| 3                                    | 18     |
| 2                                    | 10     |
| 1                                    | 4      |
| 0                                    | 0      |

**TUC = points SalesScore + points rendez-vous + points régularité**, plafonné
à 100.

### La formule, telle qu'on l'écrirait dans une cellule Excel

Pour un critère comparé à l'équipe, avec la valeur en A2, la moyenne en B2 et
le maximum de points en C2 :

```
=SI(A2>=B2*1,15;C2;SI(A2>=B2*1,05;C2*0,75;SI(A2>=B2*0,95;C2*0,5;SI(A2>=B2*0,85;C2*0,3;SI(A2>=B2*0,7;C2*0,15;0)))))
```

### Exemple sur une équipe de quatre

Équipe : Camille (SalesScore 68, 9 rendez-vous, 4 semaines actives), Léa (84,
11, 4), Yanis (52, 7, 3), Marc (34, 2, 1).

Marc a moins de 3 rendez-vous analysés : il n'a pas de TUC et il ne compte pas
dans la moyenne. La moyenne de l'équipe se calcule sur les trois autres :
SalesScore 68, rendez-vous 9.

|         | SalesScore               | Rendez-vous             | Régularité      | TUC            |
| ------- | ------------------------ | ----------------------- | --------------- | -------------- |
| Camille | 68, dans la moyenne : 20 | 9, dans la moyenne : 18 | 4 semaines : 25 | **63 %**       |
| Léa     | 84, +24 % : 40           | 11, +22 % : 35          | 4 semaines : 25 | **100 %**      |
| Yanis   | 52, -24 % : 6            | 7, -22 % : 5            | 3 semaines : 18 | **29 %**       |
| Marc    |                          |                         |                 | peu de données |

### Les règles de bord

- **Moins de 3 rendez-vous analysés sur 30 jours** : pas de TUC affiché,
  l'écran montre « peu de données », et le commercial est exclu de la moyenne
  de l'équipe. Même règle que pour le classement.
- **Un commercial seul**, sans autre commercial comparable dans
  l'organisation : pas de TUC. L'écran dit « le taux d'utilisation apparaît
  dès qu'un deuxième commercial analyse des rendez-vous ». Le TAM, lui,
  s'affiche toujours.
- **L'équipe**, c'est l'organisation entière, le commercial compris dans la
  moyenne.
- **Le sélecteur de période** (30 jours, 90 jours, 12 mois) change le TAM et
  le nombre de rendez-vous. Il ne change pas le TUC, qui reste la photo du
  lundi sur 30 jours. L'écran le dit sous le chiffre.
- **L'écart affiché sous le TUC** est la différence avec le TUC du lundi
  précédent : « +9 pts vs lundi dernier ».

## 4. Pour Stéphane : où ça se calcule et où ça se range

**Le TAM** se calcule à la lecture, sans table : compter les analyses au
statut terminé dont le rendez-vous tombe dans la période, multiplier par 60.
Pas de migration. L'écart avec la période précédente se calcule de la même
façon sur la période d'avant.

**Le TUC** se calcule une fois par semaine et se stocke. Un cron Vercel le
lundi à 6 h, heure de Paris, à côté des deux crons existants (purge RGPD à
3 h, réconciliation des analyses à 4 h). Une table nouvelle, migration
additive :

```
SellerUsageSnapshot
  id
  organizationId
  userId
  weekStart            date, le lundi
  meetingsAnalyzed30d  entier
  salesScoreAvg30d     entier ou null
  activeWeeks4w        entier de 0 à 4
  teamAvgMeetings      décimal ou null
  teamAvgSalesScore    décimal ou null
  tucPercent           entier de 0 à 100, ou null si peu de données
  computedAt           horodatage
  contrainte d'unicité sur (organizationId, userId, weekStart)
```

Le cron parcourt chaque organisation, ne retient que les commerciaux avec au
moins 3 analyses terminées sur 30 jours pour les moyennes, calcule une ligne
par commercial, y compris ceux à « peu de données » avec `tucPercent` null,
et insère ou remplace la ligne de la semaine. Idempotent : relancer le cron
le même lundi réécrit les mêmes lignes.

L'écran lit la dernière ligne du commercial pour le chiffre, et l'avant-dernière
pour l'écart. Le tableau de bord du manager et la fiche d'un commercial lisent
la même table. Aucune requête sur les autres commerciaux à l'affichage :
c'était la crainte de Thomas à la revue, et la table y répond.

Les constantes du barème (40, 35, 25, les seuils de 15, 5, 30 pour cent, les
points de régularité, le minimum de 3 rendez-vous, les 45 et 15 minutes du
TAM) vivent dans un seul fichier de domaine, `src/core/domain/usage-metrics.ts`,
avec leurs tests, pour que la formule soit lisible d'un seul coup d'œil et
modifiable sans toucher aux écrans.

## 5. Ce que dit le bouton « comment c'est calculé »

Le texte exact est celui de la maquette, il peut être repris tel quel :

> **Le temps administratif gagné.** C'est le temps que vous auriez passé à
> écrire vous-même ce que Sales Time produit. Nous comptons deux actions : le
> compte rendu d'un rendez-vous, 45 minutes, et l'e-mail de suivi, 15
> minutes. Le calcul suppose que vous utilisez ce qui est produit.

> **Votre taux d'utilisation.** Il situe votre usage de Sales Time par
> rapport à votre équipe, sur les 30 derniers jours. Il ne mesure pas votre
> valeur. Trois critères : votre SalesScore moyen (jusqu'à 40 points), vos
> rendez-vous analysés (jusqu'à 35 points), tous deux comparés à la moyenne
> de l'équipe, et votre régularité (jusqu'à 25 points), le nombre de
> semaines sur les quatre dernières où vous avez analysé au moins un
> rendez-vous. Il est recalculé une fois par semaine, le lundi. En dessous de
> trois rendez-vous analysés, il n'est pas affiché.
