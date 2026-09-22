# Lot 78 : le temps gagné, le taux d'utilisation, les périodes

Branche `lot-78`, créée depuis `lot-77`. Une migration additive (la table
des photos hebdomadaires du TUC), un cron de plus, aucune variable
d'environnement nouvelle. Lire `README.md` avant de commencer, et
`SPEC-TAM-TUC.md` pour les formules : ce fichier dit où elles s'appliquent
dans le code et ce que l'écran doit montrer.

## 1. Ce que le lot change, en une phrase par sujet

1. **Le TAM** devient « le temps administratif gagné » : un temps fixe par
   analyse terminée, 45 minutes pour le compte rendu et 15 pour l'e-mail,
   soit 60 minutes, sur la période affichée, avec l'écart contre la période
   précédente.
2. **Le TUC** devient « votre taux d'utilisation » : un pourcentage de 0 à
   100 qui situe le commercial par rapport à son équipe, calculé le lundi et
   stocké, avec l'écart contre le lundi précédent.
3. **Les périodes** deviennent 30 jours, 90 jours, 12 mois, partout où il y
   a un sélecteur, et le choix est le même d'une page à l'autre.
4. **Le tableau de bord du manager** reçoit la courbe du SalesScore de
   l'équipe sur la période.
5. **Le quota d'essai** disparaît de l'écran du commercial qui a un manager.
6. **Le SalesScore d'un rendez-vous** devient le score sur 100 de sa grille,
   pour tous les types de rendez-vous.
7. **Un transcript de moins de 250 mots** n'est pas analysé, et la fiabilité
   affichée sur la fiche vient d'abord de sa longueur.

## 2. Le TAM

**Domaine.** Un fichier nouveau, `src/core/domain/usage-metrics.ts`, porte
toutes les constantes et les fonctions pures, avec un test à côté :
`MINUTES_PAR_ANALYSE = 45`, `MINUTES_PAR_EMAIL = 15`,
`tamMinutes(nbAnalysesTerminees)`, et tout ce que le TUC demande (section 3).

**Ce qui compte.** Une analyse terminée est un rendez-vous au statut `READY`
(modèle `Meeting`, champ `status`) dont `meetingAt` tombe dans la période. Le
même compte sur la période précédente donne l'écart.

**Ce qui cesse d'être lu.** Les colonnes `tamCrMinutes`, `tamCrmMinutes`,
`tamEmailMinutes`, `tamResidualMinutes` de `OrganizationSettings`, et la
fonction `tamMinutesSavedPerMeetingFromSettings` de
`src/core/domain/dashboard-estimates.ts`. Les colonnes restent en base
(aucune migration), la fonction disparaît avec ses appelants
(`app/[locale]/company/analyse/page.tsx`, `rendez-vous/page.tsx`,
`rendez-vous/[id]/page.tsx`, `get-org-dashboard-home.ts`,
`get-org-admin-dashboard.ts`). Le champ `tamMinutesPerRdv` des figures et des
composants disparaît avec elle.

**Écran.** La tuile s'appelle « Temps administratif gagné », affiche « 9 h »
ou « 2 h 30 » (`formatDurationHoursMinutes` existe dans
`lib/format-duration-fr.ts`), et en dessous « +2 h vs 30 jours précédents »
en vert, « -1 h » en rouge, « stable par rapport aux 30 jours précédents »
sinon, et « première période mesurée » quand la période précédente est vide.
Le bouton d'aide « ? » ouvre le texte de la section 5 de `SPEC-TAM-TUC.md`.
Les tuiles vivent dans `components/organisms/dashboard-kpi-cards.tsx`
(accueil du commercial et du manager) et `analyse-kpi-cards.tsx` (Ma
performance et fiche). L'infobulle `KPI_TAM_HINT` de `lib/kpi-hints.ts` est
remplacée par ce texte.

**Côté manager.** Le tableau de bord montre le TAM de l'équipe : la somme
sur les commerciaux de l'équipe, « pour les 4 commerciaux, sur les 30
derniers jours ». Mon équipe reçoit une colonne « Temps gagné » par
commercial, triable.

## 3. Le TUC

**Domaine**, dans `usage-metrics.ts` : `TUC_MIN_RDV = 3`,
`pointsContreMoyenne(valeur, moyenne, max)` avec le barème de la
spécification (+15 % et plus : 100 % des points ; +5 à +15 : 75 % ; -5 à
+5 : 50 % ; -15 à -5 : 30 % ; -30 à -15 : 15 % ; en dessous : 0),
`POINTS_REGULARITE = {0: 0, 1: 4, 2: 10, 3: 18, 4: 25}`,
`tucPourcent({ salesScore, rdv, semainesActives }, { moyenneSalesScore,
moyenneRdv })` plafonné à 100, `null` sous 3 rendez-vous. Les tests
reprennent l'exemple de la spécification : Camille 63, Léa 100, Yanis 29,
Marc « peu de données ».

**Stockage.** Une table `SellerUsageSnapshot`, migration additive nommée
`YYYYMMDDHHMMSS_seller_usage_snapshot`, avec les colonnes de la section 4 de
la spécification et l'unicité sur `(organizationId, userId, weekStart)`. Un
port `SellerUsageSnapshotRepositoryPort` (lister les deux dernières photos
d'un commercial, lister les dernières photos d'une organisation, écrire ou
remplacer une photo), un adaptateur Prisma, un cas d'usage
`computeWeeklyUsageSnapshots` qui parcourt toutes les organisations.

**Le cron.** Une route `app/api/cron/compute-usage-snapshots/route.ts`,
protégée par `CRON_SECRET` comme les deux routes existantes, appelée par
`vercel.json` le lundi à 4 h UTC (6 h à Paris en été, 5 h en hiver, ce
qui suffit : l'écran dit « le lundi », pas l'heure). Idempotent : relancer
le même lundi réécrit les mêmes lignes. Il calcule aussi la photo de la
semaine en cours à sa première exécution, pour qu'un déploiement en milieu
de semaine n'affiche pas une case vide jusqu'au lundi.

**Écran.** La tuile s'appelle « Votre taux d'utilisation » côté commercial et
« Taux d'utilisation » sur la fiche lue par le manager ; elle affiche
« 63 % » et, en dessous, « +9 pts vs lundi dernier » ou « Recalculé chaque
lundi, le lundi 22 septembre » à la première photo. Sous 3 rendez-vous
analysés : « peu de données » et la phrase « Le taux d'utilisation apparaît
à partir de 3 rendez-vous analysés sur 30 jours ». Commercial seul dans son
organisation : « Le taux d'utilisation apparaît dès qu'un deuxième
commercial analyse des rendez-vous ». Le sélecteur de période ne change pas
le TUC, et une ligne le dit : « Photo du lundi, sur 30 jours, quelle que
soit la période affichée ». Le bouton « ? » ouvre le texte de la section 5
de la spécification. `KPI_TUC_HINT` est remplacé.

**Côté manager.** Mon équipe affiche le TUC de chaque commercial dans une
colonne triable, « peu de données » quand il est nul.

**Ce qui disparaît.** Le « TUC optimisé » actuel (temps de conversation utile
rapporté au temps de prospection), `tucOptimisePercent`,
`prospectingMinutesForStatsWindow`, la colonne `tamObjectiveMinutesPerMonth`
cesse d'être lue, et la page Ma performance ne parle plus de « temps de
prospection visé ».

## 4. Les périodes

`STATS_WINDOW_DAYS_OPTIONS` dans `src/core/domain/dashboard-stats-window.ts`
devient `[30, 90, 365]`, libellés « 30 jours », « 90 jours », « 12 mois »
(`DashboardStatsPeriodSelect`). La période choisie est partagée entre toutes
les pages qui l'affichent : tableau de bord, Ma performance, Mon équipe,
fiche d'un commercial, tableau de bord du manager. Elle est portée par le
paramètre d'adresse `?jours=` existant et mémorisée dans un cookie pour
que la page suivante l'ouvre avec la même valeur. Le sous-titre de chaque
page suit : « L'activité des 90 derniers jours, comparée aux 90 jours
précédents ».

Le seuil `MIN_RDV_FOR_STATS` qui grise une période trop pauvre reste tel
quel.

## 5. La courbe du SalesScore de l'équipe

Sur le tableau de bord du manager, la tuile « SalesScore équipe, sur 100 »
montre la moyenne pondérée par le nombre de rendez-vous, l'écart contre la
période précédente, et une courbe : un point par semaine de la période, la
moyenne des SalesScores des rendez-vous analysés cette semaine-là, en ne
comptant que les commerciaux qui ont au moins 3 rendez-vous analysés sur la
période. Une courbe se dessine à partir de deux points ; en dessous, la
tuile n'en montre pas. Le rendu suit `sparkline` de la maquette : un trait
de la couleur de marque, un point sur la dernière valeur, une étiquette
accessible « Évolution sur N semaines, dernier point X ». Les graphiques
existants (`tests/graphiques-themes.test.ts`) imposent des couleurs par
jetons, pas de valeurs écrites en dur.

## 6. Le quota d'essai

Dans `components/templates/org-dashboard-shell-frame.tsx`, le bloc « Essai
gratuit, 9 / 20 » et la fenêtre de quota atteint ne s'affichent plus à un
commercial dont l'organisation a un manager : c'est le manager qui gère le
plan. Le commercial seul dans son organisation continue de les voir. Quand
le quota est atteint, le commercial qui a un manager voit, à la place, sur
le formulaire d'analyse : « Le quota d'analyses de votre organisation est
atteint : votre manager peut l'augmenter dans Plan ».

## 7. Le SalesScore devient le score de la grille

**Aujourd'hui.** `salesScoreFromSoncasResult` dans
`src/core/domain/dashboard-sales-score.ts` fait la moyenne des six leviers,
et `src/adapters/prisma/prisma-meeting-repository.ts` le calcule à partir du
dernier résultat SONCAS. La scorecard ne tourne que pour un rendez-vous de
découverte : `scorecardGridForMeeting` rend `null` pour un type qui n'a pas
de grille, et `run-meeting-analysis.ts` répond `NO_SCORECARD_GRID`.

**Demain.** `scorecardGridForMeeting` rend la grille de découverte pour tout
type de rendez-vous, avec un drapeau `empruntee: true` quand le type n'est
pas la découverte. Le résultat de la scorecard garde ce drapeau, et la fiche
du rendez-vous affiche alors « Grille de découverte appliquée en attendant
une grille pour ce type de rendez-vous » sous le score. Le SalesScore d'un
rendez-vous est `overallScore` de sa scorecard ; sans scorecard (rendez-vous
analysés avant ce lot), il retombe sur la moyenne SONCAS, et c'est écrit en
commentaire là où le repli se fait. Un rendez-vous relancé recalcule sur la
grille.

**Conséquence.** Les moyennes des commerciaux vont bouger sur quelques
semaines, comme après la calibration SONCAS. La note du lot le dit.

## 8. Le transcript trop court et la fiabilité

**Domaine.** Dans `usage-metrics.ts` ou un fichier voisin
`transcript-fiabilite.ts` : `MOTS_MIN_ANALYSE = 250`, `nbMots(texte)`,
`fiabiliteAnalyse(mots)` qui rend `insuffisante` sous 250, `faible` sous
800, `correcte` sous 2 000, `bonne` au-dessus, avec le texte de chaque
niveau : « trop court pour être analysé », « transcript court, lecture
prudente », « transcript d'une longueur normale », « transcript long et
détaillé ».

**Formulaire.** `components/organisms/meeting-create-form.tsx` compte les
mots à la frappe et au dépôt d'un fichier, affiche « 132 mots, 250 au
minimum » sous la zone, et garde le bouton d'analyse désactivé en dessous.
Le code d'erreur `TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS` de
`lib/transcript-extract.ts` applique le même seuil côté serveur, en mots et
non en caractères, et son message dit le seuil.

**Fiche.** Le bloc « Provenance et fiabilité » de la fiche du rendez-vous
affiche « Fiabilité de l'analyse » avec le niveau, et « Transcript : 6 500
mots, transcript long et détaillé ». La fiabilité de la transcription (le
pourcentage venant de l'outil de transcription) reste une ligne à part.

## 9. Ce qui ne change pas

Le classement d'équipe et les paliers, le profil de vente en six
compétences, la calibration SONCAS et DISC, le playbook, les prompts en
base, la sécurité (les quatre points du `README.md`), le mode sombre.

## 10. Recette du lot, ce que l'écran doit montrer

Côté commercial, tableau de bord et Ma performance :

- [ ] La tuile « Temps administratif gagné » affiche un nombre d'heures
      égal à 60 minutes fois le nombre de rendez-vous analysés de la
      période, et son écart avec la période précédente.
- [ ] Le « ? » de la tuile ouvre le texte « C'est le temps que vous auriez
      passé à écrire vous-même… ».
- [ ] La tuile « Votre taux d'utilisation » affiche un pourcentage et « vs
      lundi dernier », ou « peu de données » sous 3 rendez-vous, avec la
      phrase qui l'explique.
- [ ] Le sélecteur propose 30 jours, 90 jours, 12 mois. Changer de période
      change le TAM et le nombre de rendez-vous, pas le TUC, et la ligne
      sous le TUC le dit.
- [ ] Un commercial qui a un manager ne voit plus « Essai gratuit » dans la
      colonne de gauche.
- [ ] La fiche d'un rendez-vous de type Démo ou Négociation porte un
      SalesScore sur la grille et la mention « Grille de découverte
      appliquée en attendant une grille pour ce type de rendez-vous ».
- [ ] Le SalesScore affiché en tête de fiche est le score de la scorecard
      (même chiffre que « Mon SalesScore détaillé »).
- [ ] Sur « Analyser un rendez-vous », un transcript de 100 mots laisse le
      bouton gris avec « 100 mots, 250 au minimum » ; à 250 mots il s'active.
- [ ] Sur une fiche analysée, « Provenance et fiabilité » montre le niveau
      de fiabilité et le nombre de mots.

Côté manager :

- [ ] Le tableau de bord porte le sélecteur de période, et le choix se
      retrouve sur Mon équipe et sur la fiche d'un commercial.
- [ ] La tuile « SalesScore équipe » montre une courbe quand la période
      compte au moins deux semaines de rendez-vous analysés.
- [ ] La tuile « Temps administratif gagné » de l'équipe est la somme des
      commerciaux.
- [ ] Mon équipe a deux colonnes de plus, « Temps gagné » et « Taux
      d'utilisation », triables.
- [ ] Un lundi (ou après un appel manuel du cron avec le secret), les TUC
      se mettent à jour et l'écart « vs lundi dernier » apparaît.

Vérifications après déploiement :

- [ ] `curl -s -H "Authorization: Bearer $CRON_SECRET" https://<domaine>/api/cron/compute-usage-snapshots` répond `{"ok":true,...}`.
- [ ] La table `SellerUsageSnapshot` contient une ligne par commercial et par
      organisation pour la semaine en cours.
