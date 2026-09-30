# Recette du lot 80c, quinze minutes

À faire sur votre ordinateur, dans la foulée de la recette du lot 80a :
même application locale, même base de développement (branche Neon `dev`),
même clé d'IA de développement. Une case qui ne coche pas, c'est un retour à
me faire.

## 1. La cloche et le menu (une minute)

- [ ] Un clic sur la cloche, en haut à droite, ouvre le menu
      « Notifications ». La page ne tombe pas.
- [ ] Le menu de l'utilisateur propose « Mon profil », qui ouvre le profil.

## 2. L'heure d'un rendez-vous (trois minutes)

- [ ] « Analyser un rendez-vous » : saisissez aujourd'hui, 16:30, et
      enregistrez. La fiche et la fiche du contact affichent 16:30.
- [ ] « Modifier » le rendez-vous : le formulaire propose 16:30.
      Enregistrez sans rien changer, deux fois : l'heure reste 16:30
      partout.
- [ ] Un rendez-vous saisi à 23:30 garde son jour, dans la liste comme dans
      le compte rendu.

## 3. La grille et les profils (quatre minutes)

Sur un rendez-vous analysé après la mise à jour (celui de Claire Morel, créé
à nouveau pour cette recette) :

- [ ] Dans la grille, chaque preuve citée se retrouve dans le transcript
      (Ctrl+F sur quelques mots). Aucune ne recopie la définition du
      critère (« Ce qui fait que le prospect s'en occupe maintenant »).
- [ ] Un critère sans preuve n'est pas au-dessus du niveau 1.
- [ ] La carte SONCAS dit « Levier principal détecté : … » et chaque levier
      a un score « … / 100 » ; les scores ne font plus 100 à eux six.
- [ ] La carte DISC dit « Style principal détecté : … », avec les styles
      Dominance, Influence, Stabilité, Conformité, chacun « … / 100 ».

## 4. Coach IA et onboarding (trois minutes)

- [ ] Paramètres, Coach IA, « + Ajouter une objection » : la fenêtre ne
      montre que des « Suggestions », plus de « Collection partagée ».
- [ ] En bas, « Votre formulation », puis « Ajouter à ma liste » : la
      formulation rejoint la liste de la page ; « Enregistrer » la garde.
- [ ] Un pitch de 700 caractères collé dans le champ n'est pas coupé ; le
      compteur affiche 700/2000 ; l'enregistrement passe.

## 5. Les défauts rapides (quatre minutes)

- [ ] Boutons violets : « Enregistrer le profil » et « Mettre à jour le mot
      de passe » (Mon profil), « Envoyer la demande » (Plan), « Préparer le
      briefing » (Préparer), « Envoyer » (Feedback).
- [ ] Paramètres, Équipe, « Ajouter un membre » : la liste Rôle, fermée,
      affiche son libellé, pas « MEMBER ».
- [ ] Feedback, « Remplir le formulaire » : Type et Priorité affichent
      « Bug » et « Haute », pas « BUG » et « HIGH ».
- [ ] Feedback, « Sélectionner un élément », puis « Retour » : le mode se
      ferme sans rien sélectionner.
- [ ] Paramètres, E-mail de suivi : l'exemple de signature s'affiche sur
      quatre lignes, sans « \n ».

## 6. Après la mise en ligne

- [ ] Vercel, onglet Cron Jobs du projet : `process-analysis-jobs` passe
      toutes les 15 minutes.
- [ ] Le rendez-vous de test de Claire Morel, enregistré avec l'ancien
      décalage, est remis à 16:30 une fois ; il y reste après un nouvel
      enregistrement.
