# Note du lot 80c : les correctifs de l'audit du 24 septembre

Branche `lot-80c`, créée depuis `lot-80` (le lot 80a) : 11 commits, dont un
de documentation, 73 fichiers de code, 1 349 lignes ajoutées, 511 retirées.
Aucune migration, aucune dépendance nouvelle, aucune variable
d'environnement. Un changement de configuration : la tâche planifiée de
reprise des analyses passe toutes les 15 minutes (`vercel.json`).

Le lot corrige ce que l'audit de Claude dans Chrome a classé bloquant, et
les défauts rapides qu'il a relevés. Le lot 80b (les consignes par
organisation) attend derrière lui.

## 1. Ce que la branche change

1. **La cloche** ne fait plus tomber la page : son titre de menu est dans
   un groupe, comme l'exige Base UI (erreur n° 31).
2. **L'heure d'un rendez-vous** ne bouge plus à chaque enregistrement.
   Sales Time a un fuseau, Europe/Paris, déclaré à un seul endroit
   (`src/core/domain/app-time-zone.ts`) : le serveur lit l'heure saisie
   dans ce fuseau, le formulaire l'affiche de nouveau dans ce fuseau, et toutes les
   dates affichées, le compte rendu, le mail et les données envoyées à l'IA
   s'écrivent dans ce fuseau.
3. **La grille ne note plus sur des preuves inventées.** Avant le calcul du
   score, chaque extrait cité en preuve est cherché dans le transcript et
   les notes, à quelques fautes près. Un extrait introuvable est retiré ; un
   critère resté sans preuve est ramené au niveau 1. SONCAS suit la même
   vérification, puis sa règle existante (un levier sans preuve revient à
   19).
4. **SONCAS et DISC sur la fiche** : « Levier principal détecté »,
   « Style principal détecté », scores sur 100 au lieu de parts d'un total,
   styles nommés Dominance, Influence, Stabilité, Conformité.
5. **Confidentialité** : une objection ou un argument saisi par une
   organisation va dans sa liste, et nulle part ailleurs. La collection
   partagée entre toutes les organisations n'est plus ni lue ni alimentée.
   Le pitch et le vocabulaire métier ne sont plus coupés à 500 caractères
   (limite relevée à 2 000, dépassement signalé).
6. **La file des analyses** : reprise toutes les 15 minutes au lieu d'une
   fois par nuit ; une analyse arrêtée par la limite de durée n'est plus
   relancée sans fin (le rendez-vous passe en échec après ses essais) ; un
   rendez-vous analysé depuis la fiche n'est plus analysé une seconde fois
   par la reprise.
7. **Les défauts rapides** : boutons violets sur Mon profil, Plan, Préparer
   et le Feedback ; listes déroulantes qui affichent leur libellé et non
   « MEMBER », « BUG » ou « HIGH » ; « Retour » du Feedback qui annule ;
   pages d'erreur écrites pour l'utilisateur ; exemple de signature avec de
   vrais retours à la ligne ; « Mon profil » dans le menu de l'utilisateur.

## 2. Avant de fusionner

- **Le lot 80a d'abord**, puisque le 80c est construit dessus. S'il n'y a
  pas encore de pull request pour `lot-80`, une seule pull request de
  `lot-80c` vers `main` porte les deux lots.
- **Les rendez-vous déjà enregistrés** l'ont été avec l'ancien décalage :
  leur heure s'affichera décalée (de deux heures en été). Il suffit de les
  rouvrir et de corriger l'heure une fois. Le rendez-vous de test de Claire
  Morel est dans ce cas.
- **Les analyses déjà faites** ne changent pas : la vérification des
  preuves s'applique aux analyses faites après la mise en ligne.
- **La collection partagée** garde en base ce que les organisations y
  avaient déjà mis, sans plus l'afficher. La vider est une décision à
  prendre ; la base de production ne date que du 24 septembre.
- **Le modèle reste le vrai levier de la notation.** La vérification
  empêche une note haute sans citation ; elle ne rend pas un modèle faible
  plus juste sur le fond. Voir le message D3.

## 3. Ce qui a été vérifié

Dans l'environnement de Claude, sans client Prisma :

- `npx eslint .` : 0 erreur.
- `npx jest` : 1 454 tests verts, 163 suites. La suite
  `tests/company-features.actions.test.ts`, qui importe le client Prisma,
  passe aussi avec un bouchon de ce client (retiré ensuite, jamais dans le
  dépôt) : 1 538 tests, 164 suites. Toute la batterie passe en temps
  universel comme à l'heure de Paris.
- `npx tsc --noEmit` : les 100 erreurs connues, toutes dues au client Prisma
  absent, aucune nouvelle.
- `tests/typographie.test.ts` : aucun tiret cadratin.
- Le fuseau : un aller-retour lecture puis écriture rend l'heure saisie,
  vérifié quart d'heure par quart d'heure de 2025 à 2027, changements
  d'heure compris.
- Les preuves : 75 extraits vérifiés sur un transcript de 60 000 caractères
  en 33 millisecondes.
- Une relecture indépendante de tout le lot avant l'envoi a relevé deux
  défauts de la file des analyses, aggravés par la reprise toutes les 15
  minutes, et quelques fragilités : tous sont corrigés, avec leurs tests.

## 4. La recette

`RECETTE-LOT-80C.md`, sur le poste, dans la foulée de celle du lot 80a.

## 5. Texte de la pull request

Titre :

```
Lot 80c : les correctifs de l'audit du 24 septembre
```

Description :

```
Corrige ce que l'audit du 24 septembre a classé bloquant, et les défauts rapides qu'il a relevés.

- La cloche des notifications ne fait plus tomber la page (titre de menu hors de son groupe, erreur Base UI n° 31).
- L'heure d'un rendez-vous ne bouge plus à chaque enregistrement : un fuseau unique, Europe/Paris, pour lire l'heure saisie et pour tout afficher.
- La grille ne note plus sur des preuves inventées : chaque extrait est cherché dans le transcript, un extrait introuvable est retiré, un critère sans preuve est ramené au niveau 1. Même vérification pour SONCAS.
- SONCAS et DISC sur la fiche : levier et style principaux détectés, scores sur 100.
- Confidentialité : une formulation saisie par une organisation reste dans sa liste ; la collection partagée n'est plus ni lue ni alimentée. Le pitch n'est plus coupé à 500 caractères.
- File des analyses : reprise toutes les 15 minutes, plus de relance sans fin d'une analyse trop longue, plus d'analyse en double.
- Boutons violets, libellés des listes, Retour du Feedback, pages d'erreur, exemple de signature, « Mon profil ».

Aucune migration, aucune dépendance, aucune variable d'environnement. vercel.json : la reprise des analyses passe toutes les 15 minutes.

Vérifié : eslint 0, tests verts en temps universel et à l'heure de Paris, typographie sans tiret cadratin. Recette : docs/lots/RECETTE-LOT-80C.md, sur le poste.

À fusionner après le lot 80a, avec un commit de fusion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Usf46TR18tCNNZ6PMAL6qK
```
