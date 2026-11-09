# Lot 114 : l'API de l'application mobile

Le plan prévoyait « une application mobile qui enregistre le rendez-vous
avec le micro du téléphone ». Ce lot pose le côté serveur : le téléphone se
connecte avec le compte Sales Time, dépose l'enregistrement dans le stockage
de l'organisation, et le rendez-vous devient une fiche analysée comme un
dépôt fait depuis le navigateur.

Aucune migration : le jeton du téléphone est une ligne de la table des
sessions, comme celui du navigateur. Il expire au même terme (30 jours) et
se révoque de la même façon.

## Les routes

Toutes sous `/api/mobile/v1`, en JSON, sans cookie. Sauf la connexion,
chacune exige `Authorization: Bearer <jeton>` ; l'organisation choisie part
dans l'en-tête `x-sales-time-organization` et n'est retenue que si
l'utilisateur en est membre.

| Route                | Rôle                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `POST /session`      | Connexion par e-mail et mot de passe, rend le jeton                          |
| `DELETE /session`    | Déconnexion de ce téléphone seulement                                        |
| `GET /me`            | L'utilisateur, ses organisations et l'organisation active                    |
| `POST /audio-upload` | L'autorisation de déposer un fichier audio dans le dossier de l'organisation |
| `POST /meetings`     | Transcrit l'enregistrement déposé et crée la fiche                           |
| `GET /meetings`      | Les 30 derniers rendez-vous du commercial et leur état                       |
| `GET /meetings/:id`  | L'état d'un rendez-vous                                                      |

## Les règles

- Le fichier part du téléphone directement vers le stockage, avec un jeton
  limité au dossier audio de l'organisation, à l'audio et à 20 Mo. Une heure
  de voix en mono à 32 kb/s pèse environ 14 Mo.
- Le même fichier renvoyé rend la fiche déjà créée, sans seconde
  transcription : une réponse perdue sur un réseau mobile ne double pas le
  rendez-vous.
- Le quota d'essai est vérifié avant la transcription.
- Le type de rendez-vous, le montant et l'issue sont lus dans la
  conversation ; l'issue choisie par le commercial sur le téléphone passe
  avant. Sans l'une ni l'autre, l'issue vaut « Autre ».
- Le téléphone ne reçoit jamais le transcript ni les analyses : il affiche
  l'état et ouvre la fiche sur le site.
- Un compte désactivé ne l'apprend qu'après un mot de passe juste.

## Recette en cinq minutes

Sur un déploiement de prévisualisation, avec un compte commercial :

1. `POST /api/mobile/v1/session` avec un mauvais mot de passe : 401
   `INVALID_CREDENTIALS`. Avec le bon : 201 et un jeton.
2. `GET /api/mobile/v1/me` avec le jeton : le nom et l'organisation. Sans
   jeton : 401, et non une redirection vers la page de connexion.
3. `POST /api/mobile/v1/audio-upload` avec `{"filename":"rdv.m4a","sizeBytes":30000000}` :
   413 `AUDIO_TOO_LARGE`. Avec 14000000 : un `uploadUrl` et un `clientToken`.
4. Déposer un m4a d'une dizaine de minutes avec ce jeton, puis `POST /meetings`
   avec l'URL rendue : 201 et un `meetingId`. La fiche apparaît dans
   Rendez-vous sur le site et son analyse se termine.
5. Rejouer exactement le même `POST /meetings` : 200 et
   `alreadyCreated: true`, aucune seconde fiche.
6. `DELETE /session`, puis `GET /me` avec le même jeton : 401.

## Hors du lot

Pas de limite de tentatives sur la connexion, pas plus que sur le
formulaire du site : à traiter pour les deux ensemble. L'application
elle-même est un dépôt à part.
