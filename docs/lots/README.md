# Les lots de Sales Time : le mode d'emploi

Ce dossier est le brief de quiconque, humain ou agent, prend un lot de Sales
Time. Il dit d'où vient le travail, quelles règles ne se discutent pas,
comment un lot se vérifie et comment il se livre. Le plan des lots est dans
`PLAN.md`, chaque lot a son fichier `LOT-NN.md` avec ses critères
d'acceptation, et la maquette de référence est dans
`../maquette/sales-time-maquette-11-septembre.html`.

## D'où vient le travail

Sales Time est un coach commercial : un rendez-vous de vente est transcrit,
analysé, noté sur une grille, et le commercial comme son manager en tirent
quoi faire la prochaine fois. Le produit a été repensé en septembre 2026 à
partir d'une maquette HTML validée par ses deux fondateurs, Thomas Vincent
et Cédric Laigneau, en deux revues (2 et 8 septembre). Chaque lot rapproche
le code de cette maquette : quand un écran livré ne lui ressemble pas, c'est
écrit et justifié dans la recette du lot, jamais passé sous silence.

La maquette se lit dans un navigateur, sans serveur : elle couvre le côté
commercial et le côté manager, avec des données fictives. Le bouton en haut
bascule d'un rôle à l'autre. Ouvrez-la à côté de l'application pendant tout
le lot.

## Les règles qui ne se discutent pas

1. **Le produit parle français**, ses commentaires de code aussi. Les
   consignes modifiables envoyées au modèle sont en français depuis le lot
   80 ; les enrobages fixés par le code (échelles, compétences du
   commercial) peuvent rester en anglais.
2. **Aucun tiret cadratin** (le caractère U+2014), nulle part : code, textes,
   commentaires, documents, messages de commit. `tests/typographie.test.ts`
   balaie tout le dépôt et échoue au premier. Écrivez des deux-points, des
   virgules, des parenthèses ou des points.
3. **Sales Time est destiné à être revendu** : aucun nom de client, aucune
   règle propre à une organisation dans le code. Ce qui varie d'une
   organisation à l'autre est un réglage.
4. **Mode clair seulement.** Le bloc `.dark` de `app/globals.css` ne se
   touche pas, on ne le retire pas non plus.
5. **La sécurité attend le déploiement.** Quatre points sont connus et
   volontairement laissés en l'état jusqu'à la mise en ligne des lots 75 à
   77 : identifiants super admin par défaut dans `prisma/seed.ts` et
   `.env.example`, SSRF possible dans `lib/blob-access.ts`, aucune
   limitation de débit sur l'authentification, sessions non révoquées après
   réinitialisation du mot de passe. Ne les corrigez pas dans un lot
   fonctionnel, ne les retirez pas de cette liste.
6. **Jamais la base de production depuis un poste de développement.** Ni
   `npm run db:seed` (il réinitialise le mot de passe du super admin), ni
   `prisma migrate`, ni un script. Le développement se fait sur une branche
   Neon dédiée ou une base locale. Si `DATABASE_URL` pointe vers l'hôte de
   production, on s'arrête.
7. **Les consignes enregistrées en base ne se retouchent pas** dans un lot :
   la calibration est ajoutée à l'appel, au niveau adaptateur.
8. **L'architecture est hexagonale** (voir `AGENTS.md`) : le domaine ne
   connaît ni Prisma ni Next, les cas d'usage orchestrent des ports, les
   adaptateurs implémentent. Les constantes d'un calcul vivent dans un seul
   fichier de domaine, avec leurs tests.

## Comment un lot se vérifie

Avant de dire qu'un lot est fini :

```bash
npx prisma generate
npm run verify          # typecheck, lint, tests : tout vert
npm run spellcheck      # pas plus de mots inconnus qu'avant le lot
npx jest tests/typographie.test.ts
npm run build           # sur une base de développement, jamais la production
```

Puis l'application tourne (`npm run dev`) sur une base de développement et
chaque écran touché est ouvert, comparé à la maquette, et capturé. Une
recette de cinq minutes, `RECETTE-LOT-NN.md`, liste ce qu'un fondateur doit
voir à l'écran, case par case, dans les mots de l'écran.

## Comment un lot se livre

- Une branche `lot-NN`, créée depuis la branche du lot précédent.
- Des commits par thème, avec un message qui dit ce qui change et pourquoi,
  en français, au présent, sans tiret cadratin.
- Une pull request vers `main`, fusionnée avec un commit de fusion (« Create
  a merge commit »), après recette sur la prévisualisation Vercel de la
  branche. Le compte Vercel appartient à Thomas Vincent ; les commits sont à
  son nom.
- Les migrations Prisma sont additives et passent au build (`prisma migrate
deploy && next build`). Aucune migration destructive sans décision écrite.
- Aucune nouvelle variable d'environnement sans l'écrire dans la note du lot.

## Les décisions prises, pour ne pas les rouvrir

- Le SalesScore d'un rendez-vous est le score sur 100 de sa grille (la
  scorecard), et rien d'autre : la moyenne des leviers SONCAS n'en tient
  plus lieu depuis le lot 92 (décision de Thomas, 10 octobre 2026). Un
  rendez-vous dont le type n'a pas de grille n'est pas noté et n'entre ni
  dans les moyennes ni dans le classement, jusqu'à ce que sa grille existe.
- La note ne mesure le côté des citations, l'écoute, les questions et les
  plafonds que lorsque le commercial est reconnu sûrement dans le transcript
  (rôle écrit, nom connu du produit, organisateur de la réunion). Deviné à
  l'ordre de parole, il ne l'est pas, et la fiche le dit (lot 92).
- Les citations ne font que baisser un relevé, jamais le monter ; un nombre
  cité doit être exact ; une citation fait trois mots au moins et ne sert
  qu'à un critère ; une citation tirée des notes ne vaut pas une parole du
  prospect (lot 92).
- Le commercial lit son SalesScore sur 100 ; la note sur 5 et les paliers
  (Démarrage, Progression, Maîtrise, Excellence) servent au manager pour
  classer.
- Pas de médaille par rendez-vous. Un podium, avec trophées or, argent,
  bronze, côté manager.
- Le TAM est un temps fixe par action (45 minutes par analyse, 15 par
  e-mail). Le TUC compare au reste de l'équipe, une fois par semaine. Voir
  `SPEC-TAM-TUC.md`.
- L'étape du pipeline n'est plus demandée à la création d'un rendez-vous.
- Une analyse ne démarre pas sans transcript, et pas sous 250 mots.
- Le ton du coach : des phrases avec un verbe, « notre suggestion » plutôt
  qu'un impératif, et jamais une rubrique remplie sans information dans le
  transcript.
- Le compte rendu de visite est assemblé par le produit à partir d'une
  extraction faite par le modèle ; une rubrique sans matière dit qu'elle n'a
  pas été abordée (lot 80). Il suit la règle du coaching : ce qui vient de la
  grille ne se lit que par le commercial assigné et les managers.
- Une page n'attend jamais le modèle pendant son affichage : ce qui manque
  s'écrit en arrière-plan (`after`), et la page montre un texte d'attente.
- Sales Time a un fuseau, Europe/Paris, déclaré dans
  `src/core/domain/app-time-zone.ts` : l'heure saisie se lit dans ce fuseau,
  et toute date s'affiche et part à l'IA dans ce fuseau (lot 80c).
- Une preuve citée par le modèle ne compte que si elle se retrouve dans le
  transcript ou les notes (`src/core/domain/transcript-evidence.ts`) ; un
  critère de grille sans preuve retrouvée ne dépasse pas le niveau 1.
- Rien de ce qu'une organisation saisit n'est montré à une autre
  organisation.
- Une page d'erreur parle à l'utilisateur, jamais au développeur.
- Les exemples d'une consigne montrent une forme, et la consigne le dit.
  Aucune consigne ne donne de date précise en exemple : au premier essai en
  production, un modèle a recopié celle d'un exemple dans un mail de suivi.
  `lib/default-analysis-prompts.test.ts` le garde.
- Une consigne publiée en production par le super admin se recopie dans
  `lib/default-analysis-prompts.ts` au lot suivant, pour que le bouton
  « Consigne d'origine » ramène le texte en vigueur.
- Une organisation peut remplacer six consignes (Scorecard, SONCAS, DISC,
  KISS, compte rendu, e-mail de suivi) par les siennes, dans Paramètres,
  Coach IA ; les échelles, la grille, la règle de preuve et la typographie
  restent ajoutées par le produit autour de toute consigne. La règle est
  unique (`src/core/application/resolve-analysis-prompt.ts`) : consigne de
  l'organisation, sinon version courante du super admin, sinon consigne du
  code. Le briefing, les synthèses du manager et le modèle d'IA restent
  globaux (lot 80b).
- Une consigne d'organisation ne se modifie ni ne s'efface : chaque
  enregistrement et chaque réinitialisation ajoutent une ligne, et chaque
  analyse garde la trace de la consigne qui l'a produite.
