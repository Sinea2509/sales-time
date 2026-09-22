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
   consignes envoyées au modèle peuvent rester en anglais.
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
  scorecard), pas la moyenne des leviers SONCAS. Tant qu'il n'existe qu'une
  grille, celle de la découverte s'applique à tous les types de rendez-vous,
  avec la mention « grille de découverte appliquée en attendant la sienne ».
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
