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

## 3. À faire après la fusion

- Publier la nouvelle consigne d'origine du compte rendu (Super admin,
  Prompts IA, « Compte-rendu fiche RDV »). La consigne propre à Sinéa est une
  copie modifiée : y reporter les trois règles sur les dates et le décideur.
- Ce que le code ne corrige pas : un modèle d'analyse plus solide que
  `openai/gpt-4o-mini` réduirait encore les inventions et l'instabilité du
  profil DISC. C'est un choix de coût.
