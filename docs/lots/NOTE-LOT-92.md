# Note du lot 92 : la fiabilité de la note

Branche `lot-92`, sur `main` après le lot 80i, avec les deux commits du
lot-80j repris dessus (pull request #18, qui se ferme sans fusion). Le lot
répond à l'audit du 10 octobre 2026 (`AUDIT-NOTATION-RESTITUTION.md`) et à
la décision de Thomas le même jour : « enlève le SONCAS, garde 30, 90 et
12 mois, et lance le lot 92 ».

## 1. Le commercial est reconnu, ou la note le dit

L'analyse ne donnait au produit que le nom du prospect pour reconnaître les
intervenants ; le nom du commercial, pourtant connu, n'était pas transmis.
Sans rôle écrit, le premier à parler devenait le commercial, et si c'était
faux, les preuves, les questions et l'écoute s'inversaient sans que
personne le voie.

- `findMeetingByIdForOrg` rend désormais le nom du commercial du
  rendez-vous, et l'analyse le passe aux indices d'intervenants avec celui
  du prospect.
- Quand le commercial n'est reconnu qu'à l'ordre de parole ou aux questions
  (`rolesRecognized` faux), rien de ce qui dépend de son côté ne
  s'applique : ni le côté des citations, ni l'écoute (E1), ni les questions
  (E2), ni les plafonds (E3, E4). KISS ne reçoit pas non plus la parole
  mesurée, et n'ajoute pas la puce « à arrêter » chiffrée.
- Le régime est enregistré avec la note (`speakers` : `recognized`,
  `guessed`, `none`) et l'onglet « Mon SalesScore » l'affiche : « Commercial
  deviné » ou « Intervenants non distingués », avec ce qui n'a pas été
  mesuré et comment y remédier.

## 2. Les citations ne font que baisser le relevé

Le lot-80j réécrivait les deux crans à partir des citations, dans les deux
sens : un relevé « non abordé, partiel » montait à 4 dès que le modèle
citait une question et une réponse. Le lot 92 garde l'idée (deux modèles
qui citent les mêmes passages reçoivent la même note) mais ne corrige que
vers le bas, comme le veut « dans le doute, on ne monte pas » :

- « creusé » ne tient que si la relance se voit : la question du commercial
  et la réponse du prospect sur le thème, ou deux paroles du commercial ;
  sinon « abordé » ;
- « exploitable » ne tient que si une parole du prospect donne quelque chose
  de précis (nombre, date ou échéance, nom propre) ; sinon « partiel » ;
  sans parole du prospect, un cran de moins ;
- une citation présente seulement dans les notes du commercial est gardée
  mais ne vaut pas une parole : les notes sont écrites par le commercial.

## 3. Les citations sont vérifiées plus sévèrement

- Un nombre ne se remplace pas : « on a 50 managers » ne se retrouve pas
  dans « on a 15 managers ». Un chiffre recopié de travers comptait pour un
  écart toléré, et c'est sur ce chiffre que la grille accorde le niveau 4.
  Le chiffre exigé (A1, B3, B5) est donc, de fait, lu dans le transcript.
- Un extrait fait trois mots au moins : « Oui. » ne prouve rien.
- Les morceaux d'un extrait coupé par des points de suspension se suivent
  dans le transcript, à moins de cent mots l'un de l'autre.
- Une même citation ne sert qu'à un critère : la seconde fois, elle est
  retirée.
- `hasFigure` remplace l'ancien motif : « neuf » (adjectif) et « un » ne
  comptent plus, « treize », « seize », « milliard », « moitié » comptent,
  une année seule (« en 2025 ») et un numéro de produit (« Office 365 »)
  ne comptent pas.
- `isConcrete` ne prend plus « en fin de compte », « l'année » seule ni une
  majuscule après une virgule pour quelque chose de précis.

## 4. Le cadrage ne sort du calcul que sur constat du produit

Le modèle pouvait déclarer le cadrage (E4) non observable et éviter jusqu'à
quatre points. Seul `openingNotRecorded` le sort désormais du calcul, et il
reconnaît « Enchanté » malgré l'accent. Le champ `observable` reste demandé
au modèle pour que le format ne change pas, mais il n'est plus lu.

## 5. Le SalesScore, sans repli SONCAS

Sans grille, le SalesScore était la moyenne des six leviers SONCAS : un
trait du prospect présenté comme une note du commercial, qui entrait dans
les moyennes et le classement. Depuis ce lot, un rendez-vous sans grille
lisible n'est pas noté (`salesScoreForMeeting` rend `null`), il ne compte
ni dans la moyenne ni dans le classement, et la fiche le dit. Les périodes
restent 30 jours, 90 jours, 12 mois et le calendrier.

## 6. Ce qui ne change pas

- La table du niveau, les poids de la grille v2, les seuils d'écoute et de
  questionnement, le cache des réponses (les règles sont rejouées sur les
  réponses déjà gardées : les analyses existantes reçoivent les nouvelles
  règles à la prochaine lecture de leur relevé brut, pas à l'affichage).
- Les analyses enregistrées gardent leur score ; une relance les refait
  avec les règles de ce lot.

## 7. Effets attendus sur les notes

Les notes baissent un peu sur les rendez-vous où le modèle citait large :
une citation réutilisée, un chiffre approximatif, un « creusé » sans
relance visible. Sur un transcript sans rôle ni nom du commercial, les
critères E1 et E2 reviennent au relevé du modèle, et la fiche prévient. Le
nom du commercial dans son profil (prénom et nom tels que Teams les écrit)
suffit à le faire reconnaître.

## 8. À faire après la fusion

- Publier dans Super admin, Prompts IA, la nouvelle consigne d'origine de la
  grille (« Consigne d'origine », puis « Publier ») : elle dit au modèle
  que les citations font trois mots au moins, recopient les nombres
  exactement et ne servent qu'à un critère.
- Fermer la pull request #18 (lot-80j) sans la fusionner : ses commits sont
  dans ce lot.
- Vérifier que chaque commercial a son prénom et son nom dans son profil,
  tels qu'ils apparaissent dans les transcripts Teams.

## 9. Ce que l'audit laisse aux lots suivants

Le comptage des questions (relances courtes, « qui » relatif), le plafond
E3 sur un agenda, le plan d'action du rail bâti sur les engagements
vérifiés, le mail et le briefing alimentés par l'extraction vérifiée, le
défi transmis à l'analyse suivante, les consignes contradictoires : voir
`AUDIT-NOTATION-RESTITUTION.md`, lots 94 à 98.
