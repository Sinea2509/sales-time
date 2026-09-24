# Note du lot 80a : le compte rendu de visite et les consignes en français

Branche `lot-80`, créée depuis `lot-77` (commit `8d6c47e`) : 10 commits, dont
deux de documentation, 26 fichiers de code, 2 887 lignes ajoutées, 380
retirées, dont plus de la moitié en tests. Aucune migration, aucune
dépendance nouvelle, aucune variable d'environnement nouvelle. La
spécification est dans `LOT-80.md`, sections 2 à 4 ; la section 5 spécifie
le lot 80b.

## 1. Ce que la branche change

1. **Le compte rendu de visite** suit la maquette validée : en-tête,
   participants des deux côtés, historique du compte, en une phrase, thèmes
   avec les mots du prospect, périmètre, concurrence, objections et réponses,
   profil SONCAS et DISC, maturité de l'affaire sur sept jalons,
   engagements, prochain rendez-vous, prochaines étapes, ce qui n'a pas été
   couvert, qualité du rendez-vous, note de méthode. Le modèle rend une
   extraction du transcript, le produit assemble le texte. Le transcript lu
   passe de 8 000 à 60 000 caractères. Sur la fiche : un bouton « Copier le
   compte rendu », un bloc replié au-delà de quatorze lignes.
2. **Ce que chacun peut lire.** La grille et le coaching ne se lisent que par
   le commercial assigné et les managers : pour les autres membres, la page
   retire du compte rendu la maturité, ce qui n'a pas été couvert, la
   qualité du rendez-vous et les scores de l'historique. Dans l'historique,
   le score d'un rendez-vous mené par un collègue n'est jamais repris.
3. **La fiche n'attend jamais le modèle.** Le compte rendu s'écrit à la fin
   des analyses ; s'il manque, il s'écrit après l'affichage de la page, qui
   montre le texte indicatif en attendant. Modifier un rendez-vous efface son
   compte rendu, qui est réécrit.
4. **Les consignes d'origine** SONCAS, DISC, KISS, grille et e-mail de suivi
   sont en français dans le code, identiques à celles publiées en
   production par les messages D4, D5 et D6. Des tests empêchent qu'une
   consigne contienne de nouveau une date précise à recopier.
5. **L'e-mail de suivi** reçoit la date du rendez-vous dans un bloc
   `<meeting>`. Sa consigne demande toutes les étapes convenues, chacune
   avec la personne qui s'y est engagée, les objectifs du prospect avec leurs
   chiffres, des dates entières et jamais inventées, rien de promis au-delà
   de ce que le commercial a dit, et pas de nom quand aucune signature n'est
   réglée. Les espaces laissées en fin de ligne par le modèle sont retirées.
6. **Le super admin** : un bouton « Consigne d'origine » dans l'éditeur des
   prompts, et un éditeur qui s'ouvre sur la consigne du code quand aucune
   version n'est publiée.
7. **Le test des colonnes** compare des chemins écrits de la même façon sous
   Windows et sous Linux : `npm run verify` est vert sur le poste de Thomas.

## 2. Avant de fusionner

- **Le message D6 doit être passé en production** (consigne Email de suivi en
  version 4 ; les quatre consignes d'analyse sont déjà en version 4 depuis
  D5). Sinon, après la fusion, le bouton « Consigne d'origine » du super
  admin proposera pour le mail un texte différent de celui publié : il suffit
  alors de cliquer « Consigne d'origine », puis de publier.
- **« Compte-rendu fiche RDV »** n'a aucune version en base : c'est la
  consigne du code qui sert, et c'est voulu. N'en publiez pas une ancienne.
- **Les rendez-vous déjà analysés** gardent leur ancien compte rendu, tant
  qu'ils ne sont ni modifiés ni réanalysés. Les nouveaux ont le nouveau.
- **Le modèle du compte rendu** reste celui réglé pour « Compte-rendu fiche
  RDV » (par défaut `openai/gpt-4o-mini`). Le compte rendu s'écrit dans la
  même tâche que les quatre analyses, sous la limite de 300 secondes de la
  fonction : avec un modèle lent partout, voir le point ouvert sur
  `maxDuration` dans le journal des lots.
- **La prévisualisation Vercel** de la branche n'a pas d'IA (la clé n'existe
  qu'en Production) et écrit dans la base de production. Elle sert à vérifier
  que le build passe ; la recette se fait sur le poste, section 4.

## 3. Ce qui a été vérifié

Dans l'environnement de Claude, sans client Prisma :

- `npx eslint .` : 0 erreur.
- `npx jest` : 1 428 tests verts, 160 suites. La seule suite en échec,
  `tests/company-features.actions.test.ts`, importe le client Prisma
  impossible à générer ici ; lancée avec un bouchon de ce client (retiré
  ensuite, jamais dans le dépôt), elle passe aussi : 91 tests, dont celui qui
  vérifie qu'une modification efface le compte rendu.
- `npx tsc --noEmit` : 100 erreurs, les mêmes qu'avant le lot, toutes dues au
  client Prisma absent, aucune dans un fichier du lot.
- `cspell` : 95 mots inconnus, contre 98 avant le lot.
- `tests/typographie.test.ts` : aucun tiret cadratin.
- Les consignes d'origine du code ont été comparées, au caractère près, aux
  textes des messages D4, D5 et D6 : identiques.
- Une relecture indépendante de tout le code du lot, avant l'envoi, a relevé
  quatre défauts (le coaching visible des collègues, les citations d'une
  Jeanne écartées quand le commercial s'appelle Jean, le nombre de
  rendez-vous antérieurs, la date d'un rendez-vous saisi tard le soir) et
  quelques fragilités : tous sont corrigés, avec leurs tests.

Sur le poste de Thomas, la séquence complète :

```bash
npx prisma generate
npm run verify        # typecheck, lint, tests : tout vert, Windows compris
npm run spellcheck
npx jest tests/typographie.test.ts
```

L'application n'a pas pu être lancée dans l'environnement de Claude : le
compte rendu est vérifié par 44 tests (assemblage, rubriques vides,
citations du commercial écartées, historique, titres, version sans
coaching), pas à l'écran. D'où la recette sur le poste.

## 4. La recette

`RECETTE-LOT-80A.md`, sur le poste, application locale branchée sur la base
de développement, avec le transcript fictif de
`docs/lots/recette/transcript-fictif-claire-morel.txt`. Elle demande une clé
d'IA de développement (section 5).

## 5. La clé d'IA de développement

En local, les analyses ont besoin de `AI_GATEWAY_API_KEY` dans `.env.local`.
La clé de production ne se copie pas sur un poste : elle est marquée secrète
dans Vercel, et une clé à part se révoque sans toucher à la production.

1. Dans Vercel, l'équipe qui porte le projet Sales Time : AI Gateway, API
   Keys, « Create key ». Nom : `dev-poste-local`. Si la fenêtre propose un
   budget, mettez 5 dollars.
2. Copiez la clé tout de suite : Vercel ne la montre qu'une fois.
3. Ouvrez `.env.local` dans le Bloc-notes et collez-la vous-même sur une
   ligne `AI_GATEWAY_API_KEY=` suivie de la clé, sans espace ni guillemets.
   Enregistrez, fermez.
4. Relancez `npm run dev`.

Personne d'autre ne voit la clé : ni l'onglet Code, qui vérifie seulement
que la ligne existe, ni une conversation. `.env.local` est ignoré par git.

## 6. Texte de la pull request

Titre :

```
Lot 80a : le compte rendu de visite complet et les consignes en français
```

Description :

```
Le compte rendu de visite prend la forme validée par la maquette : participants, historique du compte, en une phrase, thèmes avec les mots du prospect, périmètre, concurrence, objections et réponses, profil SONCAS et DISC, maturité de l'affaire sur sept jalons, engagements, prochain rendez-vous, prochaines étapes, ce qui n'a pas été couvert, qualité du rendez-vous, note de méthode. Le modèle rend une extraction structurée du transcript (60 000 caractères lus au lieu de 8 000), le produit assemble le texte avec les analyses déjà faites, et une rubrique sans matière est signalée comme non abordée. Sur la fiche, le compte rendu se copie d'un bouton ; il ne montre la grille et le coaching qu'au commercial assigné et aux managers, et la page n'attend jamais le modèle.

Les consignes d'origine SONCAS, DISC, KISS, grille et e-mail de suivi passent en français dans le code, identiques à celles publiées en production (messages D4, D5 et D6). Le mail de suivi reçoit la date du rendez-vous, n'invente plus de date, laisse à chacun ses engagements et recopie les objectifs chiffrés du prospect. Le super admin retrouve la consigne d'origine d'un bouton. Le test des colonnes passe sous Windows.

Aucune migration, aucune dépendance, aucune variable d'environnement. La branche contient aussi les trois commits de documentation du lot 77.

Vérifié : eslint 0, tests verts, typographie sans tiret cadratin, typecheck vert après prisma generate. Recette : docs/lots/RECETTE-LOT-80A.md, sur le poste.

Fusionner avec un commit de fusion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Usf46TR18tCNNZ6PMAL6qK
```
