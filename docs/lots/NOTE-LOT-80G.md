# Note du lot 80g : les périodes, le calendrier et la fiabilité de l'analyse

Branche `lot-80g`, sur `main` après le lot 80f. Trois demandes de Sinéa :
voir les périodes de la maquette, choisir librement la période évaluée, et
un compte rendu fiable après un rendez-vous Teams (Noz, 29 septembre) où la
répartition de la parole, plusieurs citations et la date du prochain
rendez-vous étaient fausses.

## 1. Les périodes

- Le sélecteur 30 jours, 90 jours, 12 mois est toujours visible, sur
  l'accueil, Mon équipe, Performance et la fiche d'un commercial. Une période
  qui compte peu de rendez-vous se choisit quand même, avec la pastille « peu
  de données ».
- **Le calendrier** : un quatrième bouton, « Dates », ouvre un petit
  calendrier. On y choisit « Du » et « Au », ou un raccourci : ce mois-ci, le
  mois dernier, le trimestre dernier, depuis le 1er janvier. La période
  s'écrit dans l'adresse (`?du=2026-07-01&au=2026-09-30`) et dans le cookie,
  donc elle suit le manager de page en page et dans les liens vers les
  fiches.
- Les bornes sont lues à minuit, heure de Paris, dernier jour compris. La
  comparaison se fait avec la période de même durée qui précède. Une période
  dépasse au plus trois ans.
- Les textes nomment la période : « L'activité des 92 jours du 1er juil. au
  30 sept. 2026, comparée aux 92 jours précédents ».

## 2. La fiabilité de l'analyse

- **La répartition de la parole** lit les transcripts Teams (« Nom   0:03 »)
  et les transcripts « Nom : texte ». Le commercial est reconnu par son nom,
  puis par l'organisateur de la réunion, puis par ses questions. Sur le
  rendez-vous Noz : 60 % pour le commercial au lieu de 2 %.
- **Les citations du compte rendu** sont vérifiées mot pour mot contre le
  transcript. Une objection reformulée s'affiche « En substance : … » au lieu
  d'être présentée entre guillemets.
- **Les dates** : une date absente du transcript, écrite en chiffres ou en
  lettres (« quatre novembre »), devient « à fixer ». Avec une date, un jour
  de la semaine jamais dit (« mardi » pour un mercredi) la fait aussi passer
  à « à fixer ». La consigne demande de recopier les dates telles quelles,
  d'écrire des créneaux proposés comme des propositions, et de ne nommer un
  décideur que si le transcript dit qu'il signe ou valide.
- **La date du rendez-vous** se saisit sans heure, et se remplit seule depuis
  l'en-tête d'un transcript collé, avec la durée.

## 3. La notation refondue (revue de Thomas et Cédric, 5 octobre 2026)

La revue a relevé : un même transcript noté 38 puis 22, des critères à 0 sur
des sujets traités avec d'autres mots, une note en tout ou rien, des leviers
SONCAS appuyés sur des phrases du commercial, un KISS qui contredisait la
grille et suggérait ce qui avait été fait.

- **La même note pour le même transcript.** Chaque appel se fait à
  température nulle avec une graine fixe. Surtout, le produit garde la
  réponse d'un appel et la rend à l'identique quand le même transcript
  revient avec la même consigne et le même modèle. Une consigne modifiée
  produit une nouvelle analyse.
- **Un relevé, plus une note au jugé.** Pour chaque critère, le modèle
  relève si le commercial a abordé ou creusé le thème, et ce qu'il a obtenu
  (rien, partiel, exploitable), en une phrase chacun, avec des citations
  attribuées au commercial ou au prospect. Le produit en tire le niveau par
  une table fixe : un thème seulement abordé rapporte déjà 1 ou 2 points, un
  thème creusé avec une réponse précise en rapporte 4.
- **Le thème compte, pas la formulation.** Chaque critère dit ce qu'il faut
  chercher dans tout le rendez-vous et donne des formulations en exemple,
  jamais exigées. Une grille dit aussi ce qui n'est pas attendu dans un
  rendez-vous de découverte (programme détaillé, proposition chiffrée).
- **La grille de découverte, deuxième version** : « Cadrage et prise de
  lead » entre dans la posture ; « Bénéfice attendu » rejoint « Objectifs et
  critères de succès ». Les analyses déjà faites gardent leur ancienne
  grille.
- **Qui a dit quoi.** Le produit sépare les paroles du commercial et celles du
  prospect. Une citation est rendue à la personne qui l'a dite, une
  information sans parole du prospect baisse d'un cran, et les leviers SONCAS
  ne se prouvent plus qu'avec les mots du prospect.
- **Des analyses cohérentes entre elles.** SONCAS, DISC, les objections et
  KISS reçoivent le type de rendez-vous et la parole mesurée ; KISS reçoit en
  plus le relevé de la grille, et ne doit ni le contredire ni suggérer un
  geste déjà fait. « À arrêter » dit la parole mesurée quand le commercial
  dépasse 50 %.
- **Une note lisible.** Chaque critère affiche pourquoi ce niveau (« sujet
  creusé avec relance, information partielle »), ce qui a été obtenu et ce
  qui manque, et la fiche explique le calcul.
- **Le compte rendu** part des faits : chiffres, existant, circuit de
  décision nommé, prix dits par chacun et réaction, prestataires essayés,
  suite exacte avec ses conditions. Le transcript n'est plus coupé à
  60 000 caractères, ce qui écartait la fin d'un rendez-vous Teams d'une
  heure.
- Les cartes « À accompagner en priorité » ne se chevauchent plus.

## 4. À faire après la fusion

- Publier les nouvelles consignes d'origine dans Super admin, Prompts IA :
  grille, objections, compte rendu. Les règles fixes (relevé, qui a dit quoi,
  cohérence) s'appliquent dès la fusion, même avant la republication.
- La consigne de compte rendu propre à Sinéa est une copie modifiée : la
  remplacer par la nouvelle, ou y reporter les règles.
- Le modèle reste un choix de coût : `openai/gpt-4o-mini` lit moins finement
  un transcript d'une heure qu'un modèle plus solide.
