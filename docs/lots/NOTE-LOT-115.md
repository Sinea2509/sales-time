# Lot 115 : l'après rendez-vous et la préparation sur le téléphone

Le lot 114 a permis d'enregistrer un rendez-vous sur le téléphone. Celui-ci
rend sur le téléphone ce que le commercial fait juste après, dans la voiture
ou entre deux rendez-vous, et ce qu'il relit juste avant d'entrer.

## Ce que le téléphone peut faire

| Route (`/api/mobile/v1`)             | Rôle                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `GET /meetings/:id`                  | La note, les défis, la synthèse du coaching, le mail et le compte rendu |
| `POST /meetings/:id/follow-up-email` | Écrit le mail de suivi et l'enregistre sur la fiche                     |
| `POST /meetings/:id/visit-report`    | Écrit le compte rendu s'il manque                                       |
| `POST /meetings/:id/pipedrive`       | Les blocs Pipedrive, pour les organisations qui ont la fonctionnalité   |
| `GET /contacts?q=`                   | Les contacts du commercial, pour rattacher le rendez-vous au bon        |
| `POST /contacts/:id/briefing`        | La préparation d'un rendez-vous avec un contact déjà rencontré          |
| `POST /devices`, `DELETE /devices`   | Le téléphone s'inscrit aux notifications, puis s'en retire              |

`POST /meetings` accepte un `personId` : le rendez-vous se rattache au contact
choisi dans la liste au lieu d'en créer un second. `GET /me` rend les étapes
du pipeline, pour choisir l'objectif de la préparation.

## La notification « Analyse terminée »

Le site crée déjà cette notification à la fin de chaque analyse. Elle part
maintenant aussi sur les téléphones du commercial, par le service de
notifications d'Expo. Le décorateur `PushingNotificationRepository` enrobe les
notifications existantes : le site ne change pas, et un échec d'envoi ne fait
jamais échouer l'analyse. Les téléphones qu'Expo dit désinstallés sont
oubliés.

Une table s'ajoute, `MobileDevice`, par une migration qui ne touche à rien
d'existant. Elle s'applique au déploiement, comme les précédentes.

Variable facultative : `EXPO_ACCESS_TOKEN`, seulement si l'envoi sécurisé est
activé sur le compte Expo.

## Les règles

- Le commercial n'ouvre que ses rendez-vous, le manager ceux de son
  organisation, comme pour modifier la fiche.
- Le mail écrit depuis le téléphone est celui du site, avec les mêmes
  préférences d'écriture, et s'enregistre sur la fiche. La fiche du site
  passe désormais par la même fonction (`lib/write-follow-up-email.ts`).
- Le transcript ne part jamais vers le téléphone.

## Recette

Sur la prévisualisation, avec le jeton obtenu au lot 114 :

1. `GET /meetings/:id` d'un rendez-vous analysé : la note, deux ou trois
   défis, la synthèse. Celui d'un collègue, pour un commercial : 403.
2. `POST /meetings/:id/follow-up-email` : un objet et un corps. La fiche du
   site montre le même mail.
3. `GET /contacts?q=cl` : les contacts du commercial qui commencent par « cl ».
4. `POST /contacts/:id/briefing` avec `{"targetStage":"Proposition"}` :
   l'objectif, la question à poser, les objections probables.
5. `POST /devices` avec un jeton de test, puis relancer une analyse : la
   notification arrive sur le téléphone de test.
