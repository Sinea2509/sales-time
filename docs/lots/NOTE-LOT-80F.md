# Note du lot 80f : la qualité des consignes

Branche `lot-80f`, sur `main` après le lot 80e (16b2330). Point de départ :
le prompt « SEED HUNTER » de Sinéa, comparé aux consignes d'origine de Sales
Time, et un rendez-vous de test noté 100 sur 100 par la grille.

## 1. Ce que la branche change

- **La calibration de la grille**, dans la partie non modifiable de la
  consigne (`scorecard-prompt.ts`), donc garantie quelle que soit la
  consigne publiée : le niveau 4 exige que le transcript montre à la fois la
  relance du commercial et une réponse exploitable, les deux citées ; en cas
  d'hésitation entre deux niveaux, le plus bas ; un bon premier rendez-vous
  se situe entre 50 et 65, au-dessus de 80 est exceptionnel ; un critère
  listé dans « Où gagner des points » n'est pas au niveau 4 ; tous les
  critères sont rendus, un critère absent comptant 0 pour le commercial.
- **Les phrases qui décrédibilisent** (excuse, aveu de retard, dévalorisation
  de l'offre ou de soi) passent en premier dans « à arrêter », citées mot
  pour mot avec ce qu'il aurait fallu dire, dans la grille et dans KISS.
  Présenter son entreprise et sa plaquette n'est pas un stop ; un pitch avant
  la découverte ou hors contexte en est un.
- **Le brief du coach** : le résumé KISS devient un paragraphe de 5 à 8
  phrases (situation, relation chaude, tiède ou froide avec son indice,
  direction du prochain rendez-vous, risque principal, consigne pour le
  prochain contact), et la fiche l'affiche en tête de l'onglet KISS, sous le
  titre « Le brief du coach ». Il n'était affiché nulle part.
- **Le mail de suivi** : douze lignes au plus, objet qui nomme le projet, un
  élément propre au rendez-vous, interdiction des formules creuses (« je
  reste à votre disposition », « n'hésitez pas »), documents annoncés
  seulement s'ils ont été promis, objectif du prochain rendez-vous, et deux
  postures : le mail accélère quand une étape est datée, il cultive quand
  rien n'est fixé.
- **Les clés inventées** : le modèle a rendu une fois un critère « A6 » qui
  n'existe pas, affiché tel quel dans « Où gagner des points ». Le produit ne
  garde plus que les clés de la grille (`keepKnownScorecardKeys`).
- **Les consignes propres à Sinéa** (tarif, calcul du potentiel, maturité
  des projets, OPCO, Pipedrive, cycle R1 et R2) sont rédigées dans
  `docs/lots/CONSIGNES-ORGANISATION-SINEA.md`, à coller dans Paramètres,
  Coach IA. Elles n'ont pas leur place dans les consignes d'origine,
  communes à toutes les organisations.

## 2. Ce que ça donne sur le rendez-vous de test

Transcript fictif de Claire Morel, base Neon `dev`, consignes publiées en
v3 (grille, KISS) et v2 (mail) par « Consigne d'origine » puis « Publier ».

- Grille : **85 sur 100** (100 avant le lot) ; la seule relance du
  commercial citée en preuve, par exemple « Qu'est-ce qui vous fait dire que
  la remise explique l'essentiel de la baisse ? » ; critère sans relance au
  niveau 1 ou 2. Ce transcript est écrit pour couvrir toute la grille ; 85 y
  est défendable. Une première version de la calibration, qui demandait au
  modèle de recompter ses niveaux 4, l'avait fait rendre 10 critères sur 25
  (40 sur 100 par absence) : elle a été retirée, et la règle « tous les
  critères, 0 compris » ajoutée.
- KISS : « à arrêter » vide sur ce transcript, qui n'a pas de phrase
  décrédibilisante ; brief du coach affiché.
- Mail : les deux objectifs chiffrés repris, la présentation du 7 octobre et
  la proposition d'ici vendredi, aucune formule creuse, sept paragraphes
  courts. L'objet reste « Suite à notre rendez-vous » : le modèle ne suit pas
  toujours la règle de l'objet nommé, à surveiller sur de vrais mails.

Ce qui calibrerait mieux que n'importe quelle règle : des transcripts réels
notés à la main (le fichier `SEED_CALIBRATION` du prompt d'origine), à
ajouter à la consigne de la grille en exemples.

## 3. Ce qui a été vérifié

`npm run verify` : tsc 0, eslint 0, 1 696 tests verts (191 suites), dont
les nouveaux sur les clés inconnues. `npm run spellcheck` : 0 mot inconnu
dans le dépôt. Sur le poste : les trois écrans ci-dessus, captures dans le
dossier de recette.

## 4. Après la mise en ligne

Les consignes d'origine du code ne s'appliquent en production qu'une fois
publiées : Super admin, Prompts IA, pour Scorecard RDV, KISS et Email de
suivi, bouton « Consigne d'origine » puis « Publier une nouvelle version ».
La calibration de la grille, elle, s'applique dès la mise en ligne, sans
publication, puisqu'elle est dans la partie non modifiable.

Puis coller les consignes Sinéa dans Paramètres, Coach IA
(`CONSIGNES-ORGANISATION-SINEA.md`).

## 5. Texte de la pull request

Titre :

```
Lot 80f : la qualité des consignes
```

Description :

```
Calibration de la grille dans la partie non modifiable de la consigne : niveau 4 seulement quand le transcript montre la relance du commercial et une réponse exploitable, les deux citées ; en cas d'hésitation le niveau le plus bas ; un bon premier rendez-vous entre 50 et 65 ; tous les critères rendus. Le rendez-vous de test passe de 100 à 85.

Les phrases qui décrédibilisent le commercial en premier dans « à arrêter » (grille et KISS). Le résumé KISS devient le brief du coach (situation, relation, direction, risque, consigne), affiché en tête de l'onglet KISS. Le mail de suivi : douze lignes, objet nommé, pas de formule creuse, documents justifiés, posture accélérateur ou cultivateur. Le produit ne garde que les clés connues de la grille dans « Où gagner des points ».

Les consignes propres à Sinéa (tarif, potentiel, maturité, OPCO, Pipedrive) sont rédigées dans docs/lots/CONSIGNES-ORGANISATION-SINEA.md, à coller dans Paramètres, Coach IA.

Après mise en ligne : publier les consignes d'origine Scorecard RDV, KISS et Email de suivi dans Super admin, Prompts IA.

Vérifié : tsc 0, eslint 0, 1 696 tests verts, spellcheck 0, recette sur le poste (docs/lots/NOTE-LOT-80F.md, section 2).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
