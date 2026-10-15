# Note du lot 80k : Claude 5.5, une lecture du prospect, quatre preuves exigées

Branche `lot-80k`, sur le lot 80j (PR #18, pas encore fusionnée). Demandes de
Thomas du 15 octobre 2026 : viser 0,20 € par analyse, tester Claude Sonnet
5.5, fusionner les appels, et une notation la plus pertinente possible.

## 1. Deux modèles de plus

- Claude Sonnet 5.5 et Claude Haiku 5.5 rejoignent la liste des modèles
  (Super admin, Prompts IA).
- Les modèles Claude de génération 5 refusent qu'on règle leur température :
  ils ne reçoivent que la graine. Un transcript déjà analysé reste rendu à
  l'identique par la réutilisation des appels (lot 80h).
- L'effort de réflexion reste au réglage par défaut. Essai sur Noz, grille
  seule avec Sonnet 5.5 : 55 en effort « low », 60 en « medium », 68 en
  « high ». L'effort bas coûtait moins cher mais faisait tomber à zéro des
  critères traités dans le rendez-vous.

## 2. SONCAS, DISC et objections en un seul appel

- Les trois analyses cherchent les mêmes moments du rendez-vous. Elles partent
  désormais en un seul appel, qui lit le transcript une fois et rend les trois
  lectures, chacune selon sa consigne (`run-prospect-profile-analysis.ts`).
- Chaque analyse garde sa consigne modifiable et s'enregistre à part : la
  fiche, KISS et le compte rendu ne changent pas.
- Le modèle de l'appel est celui réglé pour SONCAS. L'appel est journalisé
  une fois, sous SONCAS, avec la consigne assemblée.
- Un rendez-vous passe de 6 appels au modèle à 4 : lecture du prospect,
  grille, KISS, compte rendu.

## 3. Quatre preuves exigées pour 4 points

Les écarts de Sonnet 5.5 avec la relecture de Noz venaient de trous dans les
règles. Ces critères s'arrêtent désormais à 3 sans la preuve, vérifiée dans
les citations retrouvées (`scorecard-full-mark-proof.ts`) :

| Critère | Preuve exigée pour 4 points |
|---|---|
| A1 Taille du compte, B5 Périmètre | Un effectif dit par le prospect : personnes, groupes, sessions, sites (« 43 heures » ne compte plus) |
| B6 Historique des tentatives | Ce qui n'a pas marché ou a déçu, dit par le prospect |
| C1 Décideur | Qui décide, signe ou porte le budget, avec un nom ou une fonction |
| D1 Prochaine étape | Une date ou un créneau, et l'accord du prospect (« ça me va », « c'est noté ») |

La consigne de la grille et la fiche « Comment la note est calculée » les
décrivent, lues dans la grille elle-même.

## 4. Essais sur Noz (base de développement, 15 octobre 2026)

Relecture de référence : 72 sur 100. Grille seule, avec les règles de ce lot :

| Modèle de la grille | Note | Critères identiques à la relecture (sur 24) | Coût de la grille |
|---|---|---|---|
| Claude Sonnet 5.5, effort par défaut | 68 | 16 | 0,29 $ |
| Claude Sonnet 5.5, effort medium | 60 | non compté | 0,14 $ |
| Claude Sonnet 5.5, effort low | 55 | non compté | 0,12 $ |
| Claude Haiku 5.5 | 67 | 11 | moins de 0,01 $ |

Lecture du prospect en un appel sur Haiku 5.5 : SONCAS Argent 85 puis
Sécurité 52, DISC Conformité 90, 4 objections ; environ 0,01 $. KISS sur
Haiku 5.5 : environ 0,01 $.

Coût d'une analyse complète de Noz (55 minutes, 10 400 mots), compte rendu
compris, selon le réglage :

- grille sur Sonnet 5.5, le reste sur Haiku 5.5 : environ 0,31 $, soit
  0,27 € (un rendez-vous de 30 minutes : environ 0,15 €) ;
- tout sur Haiku 5.5 : environ 0,03 $.

Le choix du réglage en production reste à faire : il se règle dans Super
admin, Prompts IA, sans nouveau déploiement.

## Vérifications

- `npm run verify` : types, lint, 206 suites et 1 777 tests.
- Orthographe et mise en forme des fichiers modifiés.
- La version de réutilisation des appels passe à `2026-10-15.1`.
