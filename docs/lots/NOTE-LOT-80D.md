# Note du lot 80d : la conformité à la maquette du 11 septembre

Branche `lot-80d`, sur `main` après la fusion du lot 80b (9d12274). Demande
du 30 septembre : « je veux que tout soit identique » à la maquette
(`docs/maquette/sales-time-maquette-11-septembre.html`), et un compte rendu
de visite complet sur tous les rendez-vous, y compris ceux analysés avant le
lot 80a.

## 1. Ce que la branche change

- **Paramètres de l'organisation**, comme la maquette : un titre unique
  « Paramètres de l'organisation », un sous-titre qui change avec l'onglet
  (« L'équipe, le process de vente, le playbook et les consignes du coach.
  Tout ce qui appartient à votre organisation. », « Le playbook raconte comment votre
  organisation vend… », etc.), et des onglets horizontaux dans l'ordre de la
  maquette : Équipe, Process de vente, Playbook, Coach IA, E-mail. L'onglet
  Contexte, absent de la maquette, reste en dernier. Les pages n'ont plus de
  titre propre.
- **L'argumentaire** (pitch, objections, arguments clés, vocabulaire) quitte
  Coach IA, où la maquette ne le montre pas, et se range sous le playbook.
  La carte E-mail de suivi renvoie à « l'onglet E-mail ».
- **La fiche du rendez-vous** : la date du sous-titre s'écrit sans jour de
  semaine (« 25 septembre 2026 »), comme la maquette. Le pied du compte rendu
  dit « généré à partir du transcript, de la scorecard et des profils ».
- **Le compte rendu de visite** : la troisième ligne de l'en-tête de la
  maquette (« Étape : Qualifié · Potentiel estimé : 38 000 € · Fiabilité de
  l'analyse : bonne »), chaque élément seulement s'il est connu ; les
  citations signées comme la maquette, « H. Vasseur, 14'30 », avec le moment
  quand le transcript porte un horodatage devant la réplique ; les objections
  datées de même (« Objection soulevée par H. Vasseur à 14'30 : »).
- **Aucun moment inventé** : l'extraction demande le moment, mais le produit
  ne garde que ceux qui figurent tels quels dans le transcript
  (`withMomentsFromTranscript`). Vérifié : sur un transcript sans
  horodatage, le modèle en avait estimé (« 18'15 ») ; ils ne s'écrivent plus.
- **Tout compte rendu d'avant le lot 80a** (quelques lignes de synthèse, sans
  le titre « COMPTE RENDU DE VISITE ») vaut désormais « manquant » : il se
  réécrit dans la forme complète à la première ouverture de la fiche, en
  une quinzaine de secondes, avec l'état d'attente. C'est ce qui rend « super
  complet » les rendez-vous analysés avant le lot, en production comme sur le
  poste. Les comptes rendus déjà dans la forme complète ne bougent pas.

## 2. Ce qui reste différent de la maquette, et pourquoi

- **Le SalesScore** : la maquette l'annonce « sur 100, grille rendez-vous de
  découverte, ± 3 points de marge de reproductibilité » ; l'application le
  calcule comme la moyenne des six leviers SONCAS, sur la fiche, les listes,
  les tableaux de bord et le classement. Le passer sur la grille change les
  notes de tout le monde : décision à prendre à part, pas dans ce lot.
- **« version v12 »** dans la maquette, « version 2 » dans l'application :
  la maquette répète « version » et « v », l'application garde le numéro seul,
  comme la spécification du lot 80 l'avait fixé.
- **La fiabilité** : la maquette écrit « Fiabilité de transcription : 96 % »,
  une mesure que l'application n'a pas. Elle écrit la fiabilité de l'analyse
  qu'elle calcule déjà (« bonne », « correcte », « faible »).
- **L'onglet Contexte** n'existe pas dans la maquette ; il reste, en dernier.

## 3. Ce qui a été vérifié

- `npm run verify` : tsc 0, eslint 0, 1 691 tests verts (191 suites), dont
  les nouveaux : noms courts, troisième ligne d'en-tête, moments gardés ou
  retirés, ancienne forme reconnue et réécrite.
- `npm run spellcheck` : 0 mot inconnu dans le dépôt. Typographie : 0 tiret
  cadratin.
- Sur le poste, dans Chrome, base Neon `dev` : les six onglets des
  paramètres avec le titre, le sous-titre et l'onglet actif ; l'argumentaire
  sous le playbook et absent de Coach IA ; le sous-titre de la fiche sans
  jour de semaine ; le pied du compte rendu ; le rendez-vous du 24 septembre
  (compte rendu de l'ancienne forme, 1 325 caractères) réécrit à l'ouverture
  en 15 secondes dans la forme complète (8 184 caractères), en-tête à trois
  lignes, citations signées « Claire » sans moment inventé.

## 4. Avant de fusionner

- Aucune migration, aucune dépendance, aucune variable d'environnement.
- Après la mise en ligne, chaque rendez-vous ouvert dont le compte rendu
  date d'avant le lot 80a déclenche une écriture (un appel au modèle, une
  quinzaine de secondes). C'est voulu.

## 5. Texte de la pull request

Titre :

```
Lot 80d : la conformité à la maquette du 11 septembre
```

Description :

```
Paramètres de l'organisation comme la maquette : titre unique, sous-titre par onglet, onglets Équipe, Process de vente, Playbook, Coach IA, E-mail (Contexte en dernier), argumentaire rangé sous le playbook. Fiche : date sans jour de semaine, pied du compte rendu « généré à partir du transcript, de la scorecard et des profils ».

Compte rendu de visite : troisième ligne d'en-tête (étape, potentiel, fiabilité de l'analyse), citations signées « H. Vasseur, 14'30 » et objections datées quand le transcript est horodaté, aucun moment inventé (le produit ne garde que ceux qui figurent dans le transcript). Tout compte rendu d'avant le lot 80a se réécrit dans la forme complète à la première ouverture de la fiche.

Reste hors du lot, à décider : le SalesScore sur la grille plutôt que sur SONCAS, comme l'annonce la maquette.

Aucune migration, aucune dépendance, aucune variable d'environnement. Vérifié : tsc 0, eslint 0, 1 691 tests verts, spellcheck 0, typographie sans tiret cadratin, recette sur le poste (docs/lots/NOTE-LOT-80D.md, section 3).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
