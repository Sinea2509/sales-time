# Recette du lot 80b, vingt minutes

À faire sur votre ordinateur, après les recettes des lots 80a et 80c : même
application locale, même base de développement (branche Neon `dev`), même
clé d'IA de développement. La migration de ce lot passe d'abord sur la base
de développement, par l'onglet Code (message A8 du document des prompts),
jamais sur celle de production. Le transcript de test est dans
`docs/lots/recette/transcript-fictif-claire-morel.txt`.

Une case qui ne coche pas, c'est un retour à me faire.

## 1. La migration (une minute)

- [ ] `npx prisma migrate status`, lancé par l'onglet Code sur la branche
      `dev`, dit que la base est à jour, avec pour dernière migration
      `20260924120000_organization_prompt_version`.

## 2. L'écran avant toute modification (deux minutes)

Connecté avec votre compte, ouvrez Paramètres, Coach IA.

- [ ] En tête : « Les consignes du coach, méthode par méthode. Le rôle et le
      ton s'éditent, les échelles, les règles de preuve et la règle
      anti-invention sont garanties par le produit. »
- [ ] Puis l'encart, qui commence en gras par « Une consigne modifiée ne
      s'applique qu'aux rendez-vous analysés après son enregistrement. »
- [ ] Six cartes sur deux colonnes, dans cet ordre : Scorecard, rendez-vous
      de découverte ; SONCAS ; DISC ; KISS ; Compte rendu de visite ;
      E-mail de suivi. Chacune avec sa description, « Modifier la
      consigne » et « Réinitialiser ».
- [ ] « Réinitialiser » est grisé partout ; au survol, l'infobulle dit
      « Cette consigne est déjà celle d'origine de Sales Time ».
- [ ] Chaque pastille est verte : « Consigne d'origine, version N », où N
      est la version publiée dans Super admin, Prompts IA ; « Consigne
      d'origine » seul pour le compte rendu de visite, qui n'a pas de
      version publiée.
- [ ] Sous les cartes, le titre « Votre argumentaire » et les quatre champs
      d'avant : pitch, objections, arguments, vocabulaire.

## 3. Modifier la consigne SONCAS (quatre minutes)

- [ ] « Modifier la consigne » sur SONCAS : la fenêtre s'ouvre sur la
      consigne en vigueur, avec le compteur « … / 20 000 caractères ».
      « Enregistrer en nouvelle version » reste grisé tant que rien n'a
      changé.
- [ ] Effacez tout le texte, puis « Enregistrer en nouvelle version » :
      « La consigne ne peut pas être vide. », et rien n'est enregistré.
- [ ] Un clic à côté de la fenêtre ne la ferme pas. La touche
      d'échappement (en haut à gauche du clavier) affiche « Vos
      modifications ne sont pas enregistrées. Voulez-vous les abandonner ? » ;
      « Abandonner mes modifications » ferme la fenêtre, et la carte n'a pas
      changé.
- [ ] Rouvrez SONCAS. À la fin du texte, ajoutez la ligne « Termine le
      résumé par la phrase : consigne de test. », puis « Enregistrer en
      nouvelle version » : le message « Consigne enregistrée en nouvelle
      version. Elle s'applique aux prochaines analyses. » s'affiche, et la
      pastille devient ambre, « Modifiée le [date du jour] ». Au survol :
      « Modifiée par Thomas Vincent ».
- [ ] « Réinitialiser » n'est plus grisé sur la carte SONCAS, et le reste
      sur les cinq autres.

## 4. L'effet sur les analyses (six minutes, dont l'attente)

- [ ] Le rendez-vous de Claire Morel analysé pendant les recettes
      précédentes n'a pas changé : dans la section Interlocuteur, le texte
      sous son nom ne contient pas « consigne de test ».
- [ ] « Analyser un rendez-vous » : Claire Morel, date du jour, type
      Découverte, et le transcript de test. Quand la fiche passe à « Prêt »,
      le texte sous le nom de Claire, dans la section Interlocuteur, se
      termine par « consigne de test. » (c'est le modèle qui l'écrit : s'il
      l'oublie, la case suivante tranche).
- [ ] Super admin, Logs IA : l'appel SONCAS le plus récent a, dans sa
      consigne système, la phrase « Termine le résumé par la phrase :
      consigne de test. », et plus bas l'échelle du produit, « SONCAS
      driver scores ». Les appels DISC, KISS et SCORECARD du même rendez-vous
      n'ont pas la phrase dans leur consigne système.
- [ ] Si la base de développement a une deuxième organisation : entrez-y
      comme super admin, analysez-y un rendez-vous. Son appel SONCAS, dans
      Logs IA, n'a pas la phrase.

## 5. Réinitialiser (deux minutes)

- [ ] « Réinitialiser » sur la carte SONCAS : le bouton devient « Confirmer
      la réinitialisation », à côté de « Garder ma version ». « Garder ma
      version » annule, et rien ne change.
- [ ] « Réinitialiser », puis « Confirmer la réinitialisation » : « Consigne
      d'origine de Sales Time rétablie. Elle s'applique aux prochaines
      analyses. » La pastille redevient verte, « Consigne d'origine,
      version N », et « Réinitialiser » est de nouveau grisé.
- [ ] Rouvrez SONCAS : la consigne est celle du super admin, sans la
      phrase de test.

## 6. Les droits et le journal (trois minutes)

- [ ] Avec un compte commercial sans droit, si la base de développement en
      a un : Paramètres, Coach IA montre le bandeau de lecture seule, les six
      cartes et leurs pastilles, sans aucun bouton.
- [ ] Super admin, Journal d'audit : deux lignes, « Consigne d'organisation
      modifiée » puis « Consigne d'organisation réinitialisée », avec votre
      organisation. En raison : « SONCAS : nouvelle version de la consigne
      (… caractères) » et « SONCAS : consigne d'origine rétablie ».

## 7. Après la mise en ligne

- [ ] En production, Paramètres, Coach IA : les six cartes en « Consigne
      d'origine, version N », où N est la version publiée par le super
      admin (4 pour les quatre analyses depuis D5, et pour l'e-mail si D6
      est passé) ; « Consigne d'origine » seul pour le compte rendu de
      visite. Ne modifiez aucune consigne en production pour vérifier : ce
      serait la consigne de vraies analyses.
