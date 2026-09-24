# Recette du lot 80a, vingt minutes

À faire sur votre ordinateur, avec l'application lancée par l'onglet Code
sur la base de développement (branche Neon `dev`), la maquette du 11
septembre ouverte à côté. Il faut la clé d'IA de développement dans
`.env.local` (voir `NOTE-LOT-80A.md`, section 5) : sans elle, aucune analyse
ne tourne en local. Le transcript de test est dans
`docs/lots/recette/transcript-fictif-claire-morel.txt`.

Une case qui ne coche pas, c'est un retour à me faire, pas un doute à garder.

## 1. Le super admin, Prompts IA (trois minutes)

Connecté avec votre compte, ouvrez Super admin, Configuration, Prompts IA.

- [ ] « Compte-rendu fiche RDV » : l'éditeur montre une consigne en français
      qui commence par « Tu es un coach commercial B2B expert. Tu prépares la
      matière du compte rendu de visite ». Nulle part le texte « Aucun
      prompt : exécutez npx prisma db seed ».
- [ ] Au-dessus de la zone Markdown, à côté de « Aperçu rendu », un bouton
      « Consigne d'origine », grisé, puisque le brouillon est déjà la
      consigne d'origine.
- [ ] « Email de suivi » : si la version publiée dans la base de
      développement est plus ancienne que celle du code, « Consigne
      d'origine » est actif. Un clic remplace le brouillon par un texte qui
      commence par « Tu es un assistant commercial B2B expert. Tu rédiges en
      français l'e-mail de suivi », sans rien publier : le nombre de versions
      ne bouge pas.
- [ ] Publiez ce brouillon (« Publier une nouvelle version », puis
      « Confirmer ») : le bouton « Consigne d'origine » redevient grisé. Faites
      de même pour SONCAS, DISC, KISS et Scorecard RDV si leur bouton est
      actif. Tout cela ne touche que la base de développement.

## 2. Un rendez-vous analysé de bout en bout (cinq minutes, dont l'attente)

- [ ] Contacts, « Nouveau contact » : Nom complet « Claire Morel », Société
      « Menuiseries Vermont », Fonction « Directrice commerciale ». Si le
      contact existe déjà, ouvrez-le et vérifiez que la société est remplie.
- [ ] « Analyser un rendez-vous » : Prospect « Claire Morel » (choisi dans la
      liste), date du jour, durée 40, type Découverte, montant potentiel
      15000, et dans « Transcript / compte-rendu » tout le texte du fichier de
      test. Enregistrez.
- [ ] La fiche s'ouvre ; en quelques minutes le statut passe à « Prêt ». Si
      l'essai de l'organisation est épuisé, l'analyse ne part pas : dans
      Plan, « Demander un upgrade », puis passez la demande en « Converti »
      dans Super admin, Demandes de plan (base de développement seulement).

## 3. Le compte rendu de visite, sur la fiche (cinq minutes)

- [ ] Le bloc s'appelle « Compte rendu de visite », avec en dessous « Prêt à
      coller dans votre CRM. Le rendez-vous est documenté en un clic. » et, à
      droite, le bouton « Copier le compte rendu ».
- [ ] Le texte commence par « COMPTE RENDU DE VISITE », puis « Menuiseries
      Vermont · [date du jour] · Découverte · 40 min », puis « Potentiel
      estimé : 15 000 € ».
- [ ] Les titres de rubrique sont en capitales, en couleur et en gras, dans
      cet ordre : PARTICIPANTS, HISTORIQUE DU COMPTE, EN UNE PHRASE, les
      thèmes (trois à six), PÉRIMÈTRE ET VOLUMÉTRIE, CONCURRENCE ET
      ALTERNATIVES, OBJECTIONS ET RÉPONSES APPORTÉES, PROFIL DE
      L'INTERLOCUTEUR, MATURITÉ DE L'AFFAIRE, ENGAGEMENTS PRIS PENDANT LE
      RENDEZ-VOUS, PROCHAIN RENDEZ-VOUS, PROCHAINES ÉTAPES, CE QUI N'A PAS
      ÉTÉ COUVERT, ET LA QUESTION À POSER, QUALITÉ DU RENDEZ-VOUS, NOTE DE
      MÉTHODE.
- [ ] Participants : Claire Morel côté Menuiseries Vermont ; Julien Arnaud
      côté de votre organisation ; parmi les personnes citées mais absentes,
      Marc Vermont (directeur général, qui signe), le ou la responsable des
      ressources humaines, Thierry et Sofiane.
- [ ] Historique du compte : « Premier rendez-vous avec ce contact. », ou la
      liste des rendez-vous plus anciens avec Claire Morel s'il y en a dans la
      base de développement, chacun avec sa date et son score de grille.
- [ ] Les citations des thèmes sont des phrases de Claire, entre guillemets
      français, jamais des phrases de Julien.
- [ ] Concurrence et alternatives : le cabinet de Lyon, moins cher, deux
      jours en salle sans suivi.
- [ ] Profil de l'interlocuteur : les six leviers SONCAS classés du plus fort
      au plus faible, « sur 100 », puis le style DISC avec la phrase « Le DISC
      décrit une manière de communiquer observée pendant ce rendez-vous, pas
      une personnalité. », puis « Comment lui parler » et « Ce qu'il vaut
      mieux éviter ».
- [ ] Maturité de l'affaire : sept jalons, chacun « acquis », « partiel » ou
      « à obtenir », puis « Qualification : N jalons acquis sur 7 ».
- [ ] Engagements et prochaines étapes : la proposition envoyée « d'ici
      vendredi », le mail de l'après-midi, la mise en relation avec Thierry et
      Sofiane.
- [ ] Prochain rendez-vous : « le 7 octobre en fin de matinée », avec Marc
      Vermont, pour présenter la proposition, court et chiffré.
- [ ] Aucune date absente du transcript : en dehors de la date du rendez-vous
      dans l'en-tête, les seules dates sont « d'ici vendredi », « le 7
      octobre », « en novembre » et « le 15 janvier ».
- [ ] Qualité du rendez-vous : « Grille « Rendez-vous de découverte » : X sur
      100, sur 25 critères. », les blocs, un point de vigilance, et le défi du
      commercial.
- [ ] Le bloc est replié, avec un dégradé en bas ; « Tout afficher » le
      déplie, « Replier » le replie. En pied : « N caractères, générés à
      partir du transcript, de la grille et des profils. »
- [ ] « Copier le compte rendu » devient « Compte rendu copié » deux
      secondes. Collé dans le Bloc-notes, le texte est identique à l'écran,
      sans mise en forme, titres en capitales.
- [ ] Modifiez le rendez-vous (par exemple la durée, 45 au lieu de 40) et
      enregistrez : la fiche montre un texte indicatif avec « la version
      complète s'écrit en ce moment ». Une minute plus tard, en rechargeant,
      le compte rendu est revenu, avec « 45 min » dans l'en-tête. La page ne
      reste jamais bloquée pendant l'écriture.
- [ ] Si vous avez un second compte, simple commercial de la même
      organisation : sur ce rendez-vous, qui n'est pas le sien, le compte
      rendu n'a ni MATURITÉ DE L'AFFAIRE, ni CE QUI N'A PAS ÉTÉ COUVERT, ni
      QUALITÉ DU RENDEZ-VOUS, et aucun score de grille dans l'historique.

## 4. L'e-mail de suivi (deux minutes)

Sur la même fiche, « Générer le mail de suivi ».

- [ ] L'objet est sobre : « Suite à notre rendez-vous » ou équivalent, sans
      point d'exclamation.
- [ ] « Bonjour Claire, » est seul sur sa première ligne.
- [ ] Les objectifs chiffrés de Claire sont repris : moins de 5 % de remise
      moyenne à six mois, des nouveaux commerciaux qui signent seuls en trois
      mois.
- [ ] Les prochaines étapes y sont toutes : la proposition d'ici vendredi,
      l'échange de vingt minutes avec deux commerciaux avant la
      présentation, et la présentation à Marc Vermont « le 7 octobre en fin
      de matinée », date entière, écrite comme acquise et non au
      conditionnel.
- [ ] La mise en relation avec Thierry et Sofiane est demandée à Claire,
      puisque c'est elle qui a proposé de faire le lien ; Julien ne la prend
      pas à son compte.
- [ ] Le mail ne promet rien que Julien n'ait dit : ni garantie, ni
      résultat.
- [ ] Aucune date inventée : « d'ici vendredi » reste « d'ici vendredi », sans
      quantième ni mois. La date du rendez-vous peut apparaître (« suite à
      notre rendez-vous du … »), elle est juste.
- [ ] Ni anglicisme ni jargon (« adresser un défi », « impacter »,
      « réalités terrain »), ni phrase sans verbe.
- [ ] La fin : votre signature si elle est remplie dans Paramètres, E-mail
      de suivi ; sinon la formule de politesse seule, sans aucun nom.

## 5. Ce qui ne change pas, et ne doit pas avoir changé

- [ ] Les rendez-vous analysés avant le lot gardent leur compte rendu tant
      qu'on ne relance pas leur analyse.
- [ ] Les cartes SONCAS, DISC, KISS et la grille de la fiche sont celles du
      lot 77.
- [ ] Aucun tiret cadratin nulle part.
