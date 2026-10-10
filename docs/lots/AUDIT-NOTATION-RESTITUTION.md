# Audit de la notation et de la restitution (10 octobre 2026)

Base auditée : `main` à 5739cd7 (PR #17 fusionnée), plus la PR #18 (lot-80j, ouverte) et les branches lot-86 à lot-91 poussées depuis l'autre poste. Rien n'a été modifié dans le code. Les lignes citées sont celles de `main`.

## 1. Verdict en cinq lignes

- La mécanique de notation est saine : le modèle ne note pas, il relève ; le produit déduit le niveau par table, vérifie les citations, mesure l'écoute et les questions, et calcule le score. C'est la bonne architecture.
- Les points faibles sont dans ce qui alimente cette mécanique : l'identification du commercial dans le transcript, la tolérance des citations, le comptage des questions, et deux régimes de notation non comparables.
- La restitution produit beaucoup de texte mais trois sources de « question à poser » se répètent, le plan d'action du rail est inventé, le briefing est générique, et certains champs payés ne sont jamais affichés.
- Plusieurs décisions écrites dans docs/lots ne sont pas dans le code : repli SONCAS encore actif, modèle par défaut toujours `gpt-4o-mini`, limite d'essai à 5, TAM et TUC non calculés.
- Le choix manuel de la période existe déjà sur `main` (bouton « Dates », du … au …, raccourcis, adresse `?du=&au=`).

## 2. La période : déjà en place

`components/molecules/dashboard-stats-period-select.tsx` affiche 30 jours, 90 jours, 12 mois et un bouton « Dates » qui ouvre deux champs (du, au) avec quatre raccourcis (ce mois-ci, le mois dernier, le trimestre dernier, depuis le 1er janvier). Le choix est écrit dans l'adresse et dans un cookie, s'applique à toutes les pages du manager, et la comparaison se fait avec la période de même durée qui précède. Limite : trois ans. Rien à faire ici, sauf ajouter 60 jours si tu y tiens (la maquette dit 30, 90, 12 mois).

## 3. Comment la note se calcule aujourd'hui

1. Le modèle rend, pour chaque critère de la grille v2 (25 critères, blocs A 20 / B 28 / C 24 / D 12 / E 16), un relevé : exploré (non, abordé, creusé), obtenu (rien, partiel, exploitable), ce qui a été appris, ce qui manque, 0 à 3 citations avec leur auteur.
2. `LEVEL_TABLE` (`src/core/domain/scorecard-coverage.ts`) transforme le relevé en niveau 0 à 4.
3. Chaque citation est cherchée dans le transcript (`transcript-evidence.ts`, 1 écart toléré pour 5 mots). Citation introuvable : retirée. Citation trouvée chez l'autre personne : changée de côté. Critère sans preuve : niveau 1 au plus.
4. Plafonds du produit : A1 et B5 plafonnés à 3 sans chiffre du prospect ; E2 plafonné selon la part et le nombre de questions ouvertes ; E3 plafonné à 2 si pitch de 250 mots dans le premier tiers ; E1 fixé par la part de parole ; E4 retiré si le modèle le dit non observable.
5. Score de bloc = poids × somme des niveaux / (4 × critères jugés), puis somme sur 100 (`scorecard-score.ts`).
6. Température 0, graine fixe, réponse brute du modèle gardée en cache et règles rejouées à chaque lecture.
7. SalesScore = ce score ; sans grille, moyenne des six leviers SONCAS (`dashboard-sales-score.ts`).

SONCAS et DISC : le modèle rend 3 à 8 passages-clés, le produit garde ceux retrouvés dans les paroles du prospect et calcule les notes (nette 2 points, faible 1 point).

## 4. Forces à garder

- Une seule source pour la grille : consigne, schéma, calcul et fiche « comment c'est calculé » en dérivent.
- Aucune arithmétique confiée au modèle, tout est testé.
- Citations vérifiées et réattribuées, citations inventées retirées.
- Écoute et questions mesurées par comptage.
- Reproductibilité (cache) et rejouabilité (une règle corrigée s'applique aux réponses déjà gardées).
- Compte rendu assemblé par le produit, rubriques vides écrites « Non abordé », coaching retiré côté serveur pour les membres non autorisés.

## 5. Faiblesses de la notation, par impact

1. **Le commercial est deviné, et le doute n'est jamais signalé.** `run-meeting-analysis.ts:158` ne passe que le nom du prospect ; le nom du commercial, connu du produit, n'est pas transmis. Sans étiquette de rôle, le premier qui parle devient le commercial (`talk-share-from-transcript.ts:341`). `rolesRecognized` est calculé mais jamais lu par la notation. Si les rôles sont inversés, preuves, questions et écoute s'inversent et la note est fausse sans avertissement.
2. **Tous les autres intervenants sont comptés comme prospect** (`talk-share-from-transcript.ts:176`). Un collègue commercial présent gonfle l'écoute et les preuves prospect.
3. **Les notes du commercial peuvent servir de preuve prospect.** Une citation présente seulement dans `meeting.notes` passe le contrôle global et garde l'attribution « prospect » choisie par le modèle (`scorecard-coverage.ts:100-111`).
4. **Correspondance des citations trop permissive.** Morceaux vérifiés séparément et sans ordre ; un morceau exact de 1 à 3 mots suffit (« Oui. ») ; un chiffre changé compte pour un écart (« 50 managers » accepté pour « 15 managers »). Et le test de chiffre (`FIGURE`) regarde la citation du modèle, pas le texte retrouvé.
5. **Aucun contrôle de pertinence** : une même phrase du prospect peut prouver plusieurs critères.
6. **Comptage des questions fragile** (`classifyQuestion`) : « C'est-à-dire ? », « Pourquoi ? », « Combien ? » sont classées relances (tag), « Par exemple ? » fermée, alors que la grille cite ces relances comme positives ; « qui » et « quand » relatifs passent pour ouverts ; tout dépend du « ? » de la transcription ; 8 questions ouvertes pour le niveau 4 pénalise un rendez-vous court.
7. **Plafond E3 trop brutal** : un agenda ou une réponse longue à « présentez-vous » déclenche le plafond ; des répliques fusionnent quand un « oui » n'a pas été transcrit.
8. **E4 sort du calcul au choix du modèle** : déclarer « non observable » évite jusqu'à 4 points sur 16.
9. **Deux régimes de notation.** Sans intervenants distingués, ni correction de côté, ni plafonds, ni mesure : résultat plus généreux, mêlé aux autres dans le classement.
10. **Repli SONCAS du SalesScore** (`dashboard-sales-score.ts:19`) : une mesure du prospect présentée comme note du commercial. Tu as demandé « pas de lien avec le SONCAS » ; NOTE-LOT-80H §7 le laisse « à trancher ».
11. **V1 et V2 mélangés** dans le SalesScore et le classement (grilles différentes, poids différents).
12. **Cache sans purge** : un premier tirage aberrant est servi à chaque relance ; la charge relue n'est pas validée.
13. **Lot-80j (PR #18)** améliore la convergence (E2 mesuré, exploré/obtenu déduits des preuves) mais corrige vers le haut (un relevé « non + partiel » peut monter à 4), `isConcrete` accepte « en fin de compte » ou toute majuscule après une virgule, et `GREETING` rate « enchanté ». À reprendre avant fusion : ne corriger que vers le bas.
14. **Textes incohérents** : « la mesure donnée plus bas » alors qu'elle est au-dessus ; consigne « dis-le dans le coaching » alors que la grille n'écrit plus de coaching ; fiche qui dit « moins de 40 % » et plafond à 50 %.
15. **Dette** : `applyScorecardEvidenceRule` n'est utilisé que par les tests ; `scorecard-team-axes.ts:131` lit un `gridId` inconnu avec la grille v2 ; tests absents pour notes-comme-preuve, rôles inversés, plus de deux intervenants, relances courtes, faux positifs de `FIGURE`.

## 6. Faiblesses de la restitution, par impact

1. **Plan d'action du rail inventé** : fait des points perdus et des puces KISS, avec « Cette semaine » comme échéance et le commercial seul responsable (`meeting-action-plan.ts:98-105`). Les engagements réels extraits pour le compte rendu n'y sont pas, et `nextMeetingAt` n'est jamais passé.
2. **Mail et briefing relisent les JSON bruts**, pas les étapes vérifiées du compte rendu (`generate-follow-up-email.ts:82-86`). Le mail peut annoncer une suite différente du compte rendu.
3. **Briefing générique par construction** : consigne de quatre lignes qui autorise les « conseils génériques », ignore engagements, objections ouvertes, prochain rendez-vous et consigne de l'organisation.
4. **Trois sources de « question à poser »** (question en or, points perdus, suggestion par objection) répétées dans le compte rendu, le rail et les onglets, jamais dédoublonnées.
5. **Résumé SONCAS écrit avant la vérification** : le texte peut annoncer « argent » au-dessus d'une carte « principal : sécurité ».
6. **Compte rendu partiellement vérifié** : citations cherchées dans tout le transcript et non dans les paroles du prospect ; dates contrôlées sur deux champs seulement ; thèmes, engagements, rôles (« décideur ») et montants crus sur parole ; champs `who`, `response`, `moment` des objections non vérifiés.
7. **Défi non suivi** : l'écran promet « la prochaine analyse dira s'il a été fait », rien ne transmet le défi précédent.
8. **Champs générés jamais affichés** : `whatItMeans` (SONCAS et DISC), `coachingScore` et sa justification ; listes KISS vides muettes alors que la maquette écrit « Rien à signaler ».
9. **Parole mesurée deux fois avec des indices différents** : l'analyse n'a que le nom du prospect, le rail ajoute le commercial. Le pourcentage de la puce KISS et celui du rail peuvent diverger.
10. **Consignes contradictoires** : objections « 2 à 6 » contre « toutes » ; KISS « 1 à 5 par liste » contre « laisse vide » ; « consigne claire » contre « nous n'ordonnons jamais » ; DISC « garde des notes proches » alors qu'il ne note plus ; question en or définie différemment à l'écran et dans la consigne.
11. **Écarts avec la maquette** : marge de reproductibilité absente ; preuves SONCAS sans auteur ni horodatage ; « 25 critères » écrit en dur dans le rail ; plan d'action différent des « Prochaines étapes ».
12. **Confidentialité** : le rail montre score et plan d'action (tirés de la grille et de KISS) à tous les membres ; le compte rendu copié dans un CRM emporte « Qualité » et « à arrêter ».

## 7. Écarts entre les notes de lots et le code

- SalesScore sans grille : README annonce la grille de découverte « appliquée en attendant la sienne » avec mention ; le code rend `null` et retombe sur SONCAS. Aucune mention nulle part.
- Modèle par défaut : NOTE-80H annonce GPT-4o, le code garde `openai/gpt-4o-mini` (`lib/analysis-gateway-models.ts:4`, `schema.prisma:483`). Le passage est manuel en super admin, non vérifiable depuis le dépôt.
- Consignes à publier manuellement après 80f, 80g et 80h : tant que « Consigne d'origine » puis « Publier » n'ont pas été faits, la production tourne avec d'anciennes consignes modifiables. Une copie Sinéa reste figée sur l'ancienne version.
- OBJECTIONS absente de `ORGANIZATION_PROMPT_KINDS` alors que NOTE-80B dit que les cinq analyses lisent la consigne de l'organisation.
- Seuil « 250 mots » : seulement pour l'affichage de fiabilité ; le vrai blocage est 200 caractères (`lib/transcript-extract.ts`).
- Limite d'essai : 5 (`lib/team-seller-scope.ts:5`) ; le doc du 27 septembre demandait 15 et le message « votre manager peut l'augmenter ».
- TAM et TUC : tuiles renommées, calcul non fait (28 minutes par défaut × rendez-vous).
- Transcript « lu en entier » mais plafonné à 150 000 caractères.
- PLAN.md périmé (80f « à fusionner », 80g à 80i absents) ; 80i sans note ; recettes écrites seulement pour 77, 80A à 80C, cases jamais cochées.
- Sécurité, toujours ouverte : mot de passe par défaut du seed, fetch d'URL non contrôlé dans `lib/blob-access.ts`, pas de limitation de débit sur l'authentification, prévisualisations Vercel sur la base de production.

## 8. Branches lot-86 à lot-91 (autre poste)

Elles sont 57 commits derrière `main` et recouvrent des sujets déjà faits autrement (proxy, parole, SalesScore, calendrier). À ne pas fusionner. À réappliquer sur une branche neuve depuis `main` : égalités SONCAS, onglet Objections après KISS, limite d'essai 15 avec message, glisser-déposer par défaut, bouton « Analyser un rendez-vous » en haut, page de première connexion, « comment c'est calculé » structuré, vue « Ma performance » du commercial, page « Préparer un rendez-vous » (objectif de sortie, piège à éviter), bloc marque et ombre des cartes.

## 9. Plan proposé

Chaque lot part de `main`, avec note et recette dans docs/lots, PR fusionnée par merge commit après prévisualisation Vercel.

**Lot 92, fiabilité de la note (priorité 1).**

- Passer le nom du commercial aux indices d'intervenants ; appliquer côtés, plafonds et mesures seulement si `rolesRecognized`, sinon le dire sur la fiche et dans le rail (« intervenants devinés »).
- Preuves prospect cherchées dans les paroles du prospect uniquement ; preuve tirée des notes marquée à part et ne comptant pas comme parole prospect.
- Chiffre lu dans le passage retrouvé du transcript ; une substitution de nombre n'est plus un écart toléré ; minimum de mots par morceau et ordre des morceaux.
- Une même citation ne prouve pas plusieurs critères.
- E4 retiré seulement sur mesure du produit, plus au choix du modèle.
- Reprendre lot-80j : correction vers le bas uniquement, `isConcrete` et `GREETING` corrigés, puis fusionner.
- Tests pour chaque cas listé en 5.15.

**Lot 93, SalesScore et classement (priorité 1, court).**

- Retirer le repli SONCAS : sans grille, « non noté », exclu du classement et des moyennes.
- Ne mélanger dans le classement que les scores d'une même grille.
- Afficher le régime (« transcript sans intervenants ») et la marge de reproductibilité promise par la maquette.
- Remplacer « 25 critères » en dur par le nombre de la grille.

**Lot 94, questions et relances (priorité 2).**

- Réécrire `classifyQuestion` sur un corpus annoté : relances courtes comptées ouvertes, « qui » et « quand » relatifs traités, seuil de 8 ajusté à la durée.
- Plafond E3 limité au pitch produit (exclure agenda et présentation demandée).
- Réviser `FIGURE` (nombres en lettres manquants, retirer « neuf », ignorer années et noms de produits).

**Lot 95, restitution utile (priorité 2).**

- Plan d'action du rail bâti sur les engagements vérifiés (prochaines étapes, prochain rendez-vous, porteur, échéance réels).
- Mail et briefing alimentés par l'extraction vérifiée, pas les JSON bruts.
- Rubrique unique « Questions pour le prochain échange », dédoublonnée.
- Résumé SONCAS demandé après vérification, ou écart signalé.
- Afficher `whatItMeans`, `coachingScore` et « Rien à signaler ».

**Lot 96, briefing et défi (priorité 2).**

- Briefing réécrit : compte rendu précédent, objections ouvertes, défi, passages SONCAS et DISC, règles de style, interdiction du générique ; page « Préparer un rendez-vous » de lot-88 réappliquée.
- Défi transmis à l'analyse suivante avec champ « tenu, oui ou non, preuve ».

**Lot 97, consignes et vérifications du compte rendu (priorité 3).**

- Aligner les consignes contradictoires (objections, KISS, DISC, question en or, « plus bas », « coaching », 40 et 50 %) et ajouter OBJECTIONS aux consignes d'organisation.
- Étendre les vérifications du compte rendu : citations dans les paroles du prospect, dates sur tous les champs, montants et noms comparés au transcript.
- Deux versions du compte rendu (CRM sans coaching, manager complète) et rail limité selon les droits.

**Lot 98, dette et documentation (priorité 3).**

- Modèle par défaut GPT-4o dans le code ; limite d'essai 15 ; seuil 250 mots réel avec compteur ; cache validé par Zod et relance qui ignore le cache.
- PLAN.md et notes remis à jour ; recettes exécutées et cochées ; jeu de recette enrichi (format Teams, transcript court, type autre que découverte).
- Réappliquer les éléments de lot-86 à lot-89 listés en 8.

**À faire à la main en production, dès maintenant** : publier les consignes réécrites (grille, KISS, SONCAS, DISC, objections, compte rendu, mail) depuis « Consigne d'origine » puis « Publier », choisir GPT-4o, et vérifier la copie Sinéa.

## 10. À trancher

1. Repli SONCAS : le retirer (ma recommandation, conforme à ta demande) ou le garder avec une mention.
2. Périodes : 30, 90, 12 mois comme la maquette, ou ajouter 60 jours.
3. Lot-80j : le reprendre dans le lot 92 (recommandé) ou le fusionner tel quel maintenant.
