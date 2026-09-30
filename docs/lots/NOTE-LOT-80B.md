# Note du lot 80b : les consignes par organisation

Branche `lot-80b`, créée depuis `lot-80c` (lui-même construit sur le lot
80a) : 6 commits, dont un de relecture et un de documentation, 37 fichiers
hors documentation, 3 386 lignes ajoutées, 131 retirées, dont plus de la
moitié en tests. **Une migration**, additive. Aucune dépendance nouvelle,
aucune variable d'environnement. La spécification est dans `LOT-80.md`,
section 5.

## 1. Ce que la branche change

1. **Chaque manager règle les consignes de son organisation**, dans
   Paramètres, Coach IA : Scorecard, SONCAS, DISC, KISS, compte rendu de
   visite et e-mail de suivi. Six cartes, avec l'encart de la maquette ;
   « Modifier la consigne » ouvre la consigne en vigueur, « Enregistrer en
   nouvelle version » la garde pour les prochaines analyses,
   « Réinitialiser » rend la consigne d'origine. La pastille dit
   « Modifiée le 24 septembre 2026 » (et par qui, au survol) ou « Consigne
   d'origine, version N ». Les quatre champs d'avant restent dessous, sous
   « Votre argumentaire ».
2. **La règle de résolution**, à chaque analyse : la consigne de
   l'organisation si elle en a enregistré une, sinon la version courante du
   super admin, sinon celle du code. Les échelles, la grille, la règle de
   preuve, la typographie et les compétences du commercial s'ajoutent autour,
   quelle que soit la consigne. Le briefing, les synthèses du manager et le
   modèle d'IA restent réglés par le super admin, pour toutes les
   organisations.
3. **La trace** : chaque analyse enregistre la consigne d'organisation qui
   l'a produite, et le journal des appels d'IA l'écrit `org:<identifiant>` à
   la place du numéro de version.
4. **Les droits** : seul qui peut modifier les réglages de l'organisation
   enregistre ou réinitialise, et l'organisation vient de la session, jamais
   du formulaire. Les autres membres voient l'état des six consignes, sans
   leur texte. Chaque enregistrement et chaque réinitialisation s'inscrivent
   au journal d'audit du super admin (« Consigne d'organisation modifiée »,
   « Consigne d'organisation réinitialisée »).
5. **La base** : une table `OrganizationPromptVersion`, où rien ne se modifie
   ni ne s'efface (un enregistrement ou une réinitialisation ajoutent une
   ligne), et une colonne facultative sur `MeetingAnalysis`.

## 2. Ce que le code a précisé par rapport à la spécification

- **L'auteur d'une consigne devient nul** si le super admin supprime son
  compte (la spécification disait `Restrict`) : sinon, la suppression d'un
  utilisateur qui a modifié une consigne échouerait. La ligne reste.
- **Un texte identique à celui en vigueur n'ajoute rien.** Enregistrer sans
  rien changer figerait la consigne d'origine du jour, et l'organisation ne
  recevrait plus les améliorations du super admin. Le bouton
  « Enregistrer en nouvelle version » reste grisé tant que rien n'a changé.
- **Protections ajoutées après la relecture** : la fenêtre ne se ferme pas
  sur un clic à côté et demande de confirmer l'abandon d'un texte modifié ;
  « Réinitialiser » se confirme d'un second clic ; une action refuse
  d'écrire si l'organisation active a changé dans un autre onglet
  (« L'organisation active a changé dans un autre onglet : rechargez la
  page avant d'enregistrer. »).
- **Les membres sans droit** voient les cartes et leurs pastilles, sans
  bouton : le texte complet des consignes reste réservé aux managers.
- **La carte DISC** ne promet pas « ses propres preuves » par style ni « la
  même règle que SONCAS », comme la maquette : le schéma DISC n'a qu'une
  liste de preuves pour les quatre styles, et aucune règle du produit ne
  ramène un style annoncé sans appui. Elle dit : « Au-dessus de 19, un style
  s'appuie sur un comportement ou une phrase du prospect. »
- **Les nombres des cartes** (25 critères, 5 blocs, niveaux 0 à 4, seuil
  de 19) viennent des règles elles-mêmes, pas d'une copie.

## 3. Avant de fusionner

- **L'ordre : 80a, puis 80c, puis 80b.** Le 80b est construit sur les
  deux autres. Si aucune pull request n'est encore ouverte pour `lot-80` ou
  `lot-80c`, une seule pull request de `lot-80b` vers `main` porte les trois
  lots.
- **La migration passe au build** (`prisma migrate deploy && next build`).
  Elle est additive : la version en ligne ignore la nouvelle table et la
  nouvelle colonne, et rien ne casse si elle est appliquée avant le code.
  Attention au point ouvert du journal des lots : **les prévisualisations
  Vercel écrivent dans la base de production**, et Vercel construit une
  prévisualisation à chaque envoi d'une branche sur GitHub. La migration y
  sera donc appliquée dès que `lot-80b` sera poussée, avant la fusion.
  C'est sans risque pour ce lot, mais une migration appliquée ne se modifie
  plus : si le lot devait changer, on ajouterait une migration, sans
  toucher celle-ci.
- **La recette se fait sur le poste d'abord**, sur la branche Neon `dev`,
  avant « on envoie ». La migration y passe par la commande
  `npx prisma migrate deploy`, une fois vérifié que l'adresse de la base est
  bien celle de `dev`. Jamais contre la base de production depuis un poste.
- **À savoir, pour le produit** : une consigne modifiée est une copie
  complète. Une organisation qui a changé une phrase ne reçoit plus les
  versions suivantes du super admin tant qu'elle n'a pas cliqué
  « Réinitialiser », et la carte ne le signale pas encore. Et tout manager,
  y compris d'une organisation à l'essai, peut lire le texte complet des six
  consignes d'origine : c'est le prix d'une consigne modifiable.

## 4. Ce qui a été vérifié

Pour la première fois, le client Prisma a pu être généré dans
l'environnement de Claude : la vérification porte sur le vrai client, sans
bouchon.

- `npx tsc --noEmit` : 0 erreur, sur chacun des commits de la branche.
- `npx eslint .` : 0 erreur.
- `npx jest` : 1 607 tests verts, 172 suites, dont 69 nouveaux : la règle
  de résolution, l'isolement entre organisations, la trace sur l'analyse
  et dans le journal, les enrobages du produit autour d'une consigne
  d'organisation (échelles SONCAS et DISC, grille, compétences du
  commercial, typographie), les analyses déjà faites qui ne bougent pas, la
  panne de lecture de la table (l'analyse échoue et sera reprise, plutôt que
  de partir avec une autre consigne), les droits, le changement
  d'organisation dans un autre onglet, les requêtes de l'adaptateur.
- `tests/typographie.test.ts` : aucun tiret cadratin. `npm run spellcheck` :
  95 mots inconnus, comme avant.
- **La migration** a été écrite par le moteur de schéma de Prisma lui-même
  (sa version WebAssembly), puis appliquée, avec toutes les migrations
  précédentes, sur un vrai Postgres (PGlite, Postgres 17 en mémoire) :
  l'historique complet des migrations rend exactement le nouveau schéma,
  sans aucune dérive.
- **L'adaptateur, sur ce Postgres**, avec le client généré : 18
  vérifications vertes, dont l'isolement entre organisations, la dernière
  ligne qui fait foi, la trace sur l'analyse, le journal d'audit, l'auteur
  supprimé (la ligne reste) et l'organisation supprimée (ses consignes
  partent avec elle).
- **L'écran**, rendu dans un vrai navigateur : les six cartes, les
  infobulles (y compris sur « Réinitialiser » grisé), la fenêtre, le refus
  d'une consigne vide, la réinitialisation en deux temps, l'abandon
  confirmé, la lecture seule, et l'affichage sur téléphone.
- Une relecture indépendante de tout le lot avant l'envoi a relevé trois
  défauts importants (changement d'organisation dans un autre onglet, texte
  du manager trop facile à perdre, adaptateur testé seulement à travers un
  double) et quelques fragilités : tous sont corrigés, avec leurs tests.

## 5. La recette

`RECETTE-LOT-80B.md`, sur le poste, après celles des lots 80a et 80c.

## 6. Texte de la pull request

Titre :

```
Lot 80b : les consignes par organisation
```

Description :

```
Chaque manager règle, pour son organisation, les six consignes du coach (Scorecard, SONCAS, DISC, KISS, compte rendu de visite, e-mail de suivi), dans Paramètres, Coach IA.

- Règle de résolution à chaque analyse : consigne de l'organisation, sinon version courante du super admin, sinon consigne du code. Les échelles, la grille, la règle de preuve et la typographie s'ajoutent autour, quelle que soit la consigne.
- Écran de la maquette : six cartes, « Modifier la consigne », « Enregistrer en nouvelle version », « Réinitialiser » (confirmé d'un second clic), pastille « Modifiée le … » ou « Consigne d'origine, version N ».
- Droits : seul un manager enregistre ou réinitialise, l'organisation vient de la session, et l'action refuse d'écrire si elle a changé dans un autre onglet. Journal d'audit : ORG_PROMPT_UPDATED, ORG_PROMPT_RESET.
- Trace : chaque analyse garde la consigne d'organisation qui l'a produite ; le journal des appels l'écrit « org:<identifiant> ».

Une migration additive (20260924120000_organization_prompt_version) : une table OrganizationPromptVersion, en ajout seul, et une colonne facultative sur MeetingAnalysis. Aucune dépendance, aucune variable d'environnement.

Vérifié : tsc 0, eslint 0, 1 607 tests verts, migration appliquée sur un Postgres réel sans dérive avec le schéma, typographie sans tiret cadratin. Recette : docs/lots/RECETTE-LOT-80B.md, sur le poste.

Fusion avec main du 30 septembre (lots 78 à 85, voir la section 7 de la note) : le compte rendu de visite garde la forme du lot 80a et s'écrit à la première ouverture de la fiche, comme le mécanisme du lot 80 de GitHub, avec un état d'attente ; la fiche à sept onglets, l'audio et les objections de main sont conservés. Correctif au passage : les routes /api (crons, compte rendu à l'ouverture) répondaient 404 derrière le middleware de langue. Après fusion : tsc 0, eslint 0, 1 684 tests verts, migrations à jour sur la branche dev.

À fusionner avec un commit de fusion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Usf46TR18tCNNZ6PMAL6qK
```

## 7. Fusion avec main du 30 septembre

Le lot 80b a été codé sur lot-77. Entre son envoi et son intégration, GitHub
a reçu huit lots (78 à 85 : avancement de l'analyse, rattrapage toutes les
cinq minutes, compte rendu qui s'écrit sous les yeux du lecteur, audio
transcrit, fiche à sept onglets, onglet Objections, tableaux de bord, plan
d'action). La branche `lot-80` de GitHub est un autre travail que le
`lot-80` de ce lot : elle n'a pas été poussée, et les trois lots (80a, 80c,
80b) arrivent par la seule branche `lot-80b`, avec un commit de fusion de
`main` (`4b25015`).

Ce que la fusion tranche :

- **Le compte rendu de visite** est celui du lot 80a : rubriques imposées,
  composées par le produit à partir de l'extraction et des analyses,
  branchées sur la consigne de l'organisation. Il ne s'écrit plus à la fin
  de l'analyse mais **à la première ouverture de la fiche**, comme le
  prévoyait le lot 80 de GitHub : la fiche s'ouvre tout de suite, montre
  « Rédaction du compte rendu… », et l'affiche d'un bloc dès qu'il est
  écrit, sans recharger (route `POST /api/meetings/[id]/visit-report`,
  cas d'usage `writeMeetingVisitReportOnDemand`). Le compte rendu diffusé
  mot à mot de GitHub disparaît : deux comptes rendus pour une fiche
  n'auraient pas de sens. Les rubriques de la grille restent retirées pour
  un membre qui n'est ni le commercial ni un manager, dans la route comme
  sur la page.
- **La fiche** (en-tête, colonne de droite, sept onglets) est celle de
  GitHub ; l'en-tête reprend le fuseau de Paris du lot 80c. Les composants
  « interlocuteur » du lot 80c, que GitHub avait remplacés par les onglets
  SONCAS et DISC, disparaissent avec eux.
- **Les consignes d'origine** en français du lot 80a restent, et la
  consigne des objections de GitHub s'y ajoute. Les cinq analyses
  (SONCAS, DISC, KISS, grille, objections) lisent la consigne de
  l'organisation.
- **Le rattrapage** passe toutes les cinq minutes (GitHub), et la
  documentation suit.
- **Les routes `/api` répondaient 404**, en local comme en production :
  `proxy.ts` les passait au middleware de langue, qui les réécrivait vers
  une page de langue inexistante. Les crons de rattrapage et le compte rendu
  à l'ouverture n'atteignaient donc jamais leur code. Corrigé (`d014f26`) :
  ces chemins gardent le contrôle de session et évitent la réécriture.

Vérifié après fusion : `tsc` 0 erreur, `eslint` 0, 1 684 tests verts
(191 suites, dont 7 nouveaux sur l'écriture à l'ouverture), typographie
sans tiret cadratin, `spellcheck` sans mot inconnu dans le dépôt (les
identifiants et prénoms de GitHub sont ajoutés au dictionnaire), les deux
migrations appliquées sur la branche Neon `dev` (`20260924120000` du lot,
`20260926120000` de GitHub). Sur le poste, dans Chrome : la fiche fusionnée
affiche le compte rendu enregistré avec ses titres ; un compte rendu vidé se
réécrit à l'ouverture en une dizaine de secondes et reste enregistré ; Coach
IA, Prompts IA et Logs IA sont en place ; `/api/health` et le cron
répondent 200.

À refaire après la mise en ligne, en plus de la section 7 de la recette :
la case « cron toutes les cinq minutes » de la recette 80c, qui ne pouvait
pas passer avant ce correctif.
