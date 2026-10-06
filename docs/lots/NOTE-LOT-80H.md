# Note du lot 80h : un rôle par analyse, et le système de notation visible

Branche `lot-80h`, sur `main` après le lot 80g. Deux remarques de Thomas
après la mise en production du 80g : « je veux que les prompts affichent
clairement le système de scoring, aujourd'hui je ne le vois pas », et
« certains prompts se croisent ».

## 1. Les consignes ne se croisent plus

| Analyse | Son rôle, et lui seul |
|---|---|
| Grille | La note du commercial (SalesScore), le relevé par critère, « Où gagner des points » |
| KISS | Le coaching : à garder, à améliorer, à arrêter, à démarrer, la question en or, le défi |
| Objections | Les objections du prospect et leur traitement |
| SONCAS, DISC | Le profil du prospect |
| Compte rendu | Les faits du rendez-vous ; il reprend les autres analyses sans les refaire |

- La grille n'écrit plus de coaching. Avant, elle et KISS écrivaient chacun
  leurs conseils, et la fiche en affichait deux séries qui se contredisaient.
- Le défi passe à KISS, avec la question en or. Les analyses déjà faites
  gardent le défi que leur grille portait.
- Le compte rendu reprend les objections de leur analyse au lieu d'en
  relever une seconde liste (sur Noz : quatre d'un côté, une de l'autre).
- Les consignes de la grille et de KISS disent désormais leur rôle et celui
  des autres analyses.

## 2. Le système de notation se lit

Dans Super admin, Prompts IA, et dans la fenêtre de chaque consigne de
Paramètres, Coach IA, une fiche ouverte en tête dit pour chaque analyse :
son rôle, ce qu'elle produit, ce qu'elle ne fait pas, et comment elle note.
Pour la grille :

- les 25 critères, leurs blocs et leurs points ;
- la table qui tire le niveau du relevé ;
- critère par critère, ce qu'il faut obtenir pour avoir 4 points, ce qui
  compte, et des questions qui y mènent (d'autres mots comptent aussi) ;
- comment avoir une bonne note, et les paliers affichés.

Tous les chiffres de la fiche sont lus dans les constantes du produit : elle
ne peut pas dire autre chose que ce que le calcul fait.

## 3. Une grille plus pointue (Thomas, 6 octobre)

Quatre règles, toutes appliquées par le produit et non laissées au jugement
du modèle :

- **Un critère non observable ne coûte rien.** Le cadrage (E4) sort du
  calcul quand l'enregistrement a commencé après l'ouverture du
  rendez-vous : son bloc se mesure sur les autres critères. Avant, il valait
  0 ou 1 faute de pouvoir être vu.
- **Un argumentaire déroulé avant la découverte est pénalisé.** Une prise de
  parole du commercial de plus de 250 mots dans le premier tiers du
  rendez-vous plafonne la personnalisation (E3) à 2 (Noz : 576 mots).
- **Les questions fermées et de vérification ne comptent pas.** Le produit
  compte les questions du commercial : 4 en questionnement (E2) demande au
  moins 55 % de questions ouvertes, 3 au moins 40 %, sinon 2 (Noz : 20
  ouvertes, 22 fermées, 12 de vérification).
- **Un chiffre exigé pour le niveau 4** en taille du compte (A1), impact
  (B3) et volumétrie (B5) : sans nombre dit par le prospect, le critère
  reste à 3.

Chaque plafond est affiché sur le critère, avec sa raison.

## 4. SONCAS et DISC par passages-clés

Thomas : « il faut cibler les questions et passages du rendez-vous, pas des
verbatim pris partout ». Le modèle ne note plus les leviers ni les styles.
Il relève 3 à 8 passages-clés :

- pour SONCAS, les réponses du prospect qui révèlent ce qui le fait choisir :
  ce qui est important pour lui, ce qu'il attend d'un prestataire, ce qui
  l'a déçu, sa réaction au prix, ses conditions, ses objections ;
- pour DISC, les moments où sa façon de réagir se voit : réponse à une
  question ouverte, réaction au prix ou à une proposition, objection.

Pour chaque passage : les mots du prospect, la question qui les a amenés,
les leviers ou styles qu'il montre, nets ou faibles. Le produit vérifie
chaque passage dans les paroles du prospect, puis calcule les notes : deux
points par passage net, un par passage faible, lus dans une table fixe
(0 point : 10 ; 1 : 25 ; 2 : 45 ; 4 : 62 ; 6 : 78 ; 8 : 90). Les onglets
SONCAS et DISC affichent ces passages.

## 5. Le modèle

Thomas a validé un modèle plus solide. Le compte Vercel AI Gateway est au
niveau gratuit, qui refuse Claude Sonnet 4.6, Claude Haiku 4.5, GPT-5.4 et
Gemini 2.5 Pro (« Free tier users do not have access to this model »). Les
analyses de rendez-vous passent donc à `openai/gpt-4o`, le plus solide des
modèles accessibles (avec GPT-4o mini, Gemini 2.5 Flash et Mistral Small).
Claude Sonnet 4.6 demande d'ajouter des crédits payants au compte Vercel AI
Gateway ; le choix se fait ensuite dans Super admin, Prompts IA, modèle de
chaque consigne. Changer de modèle sans crédits ferait échouer toutes les
analyses.

## 6. À faire après la fusion

- Publier dans Super admin, Prompts IA, les nouvelles consignes d'origine de
  la grille, de KISS, de SONCAS, de DISC et des objections (« Consigne
  d'origine », puis « Publier »), et choisir GPT-4o comme modèle de ces analyses et
  du compte rendu.

## 7. Un croisement restant, à trancher

Quand un rendez-vous n'a pas de grille (type autre que découverte), le
SalesScore affiché est la moyenne des six leviers SONCAS, c'est-à-dire un
trait du prospect présenté comme une note du commercial. Le retirer
changerait les moyennes déjà affichées : c'est une décision produit.
