# Lot 80 : le compte rendu et les consignes

Le lot est coupé en deux pour avancer vite. **80a** ne touche pas la base de
données : il est codé sur la branche `lot-80`, créée depuis `lot-77`. **80b**
ajoute une table : il est codé sur la branche `lot-80b`, créée depuis
`lot-80c`, les correctifs de l'audit du 24 septembre passés entre les deux
(`NOTE-LOT-80C.md`). Lire `README.md` avant de commencer. Le lot 78 passe
après : les deux lots sont indépendants.

## 1. Ce que le lot change, en une phrase par sujet

80a, codé le 24 septembre :

1. **Le compte rendu de visite** prend la forme validée par la maquette,
   rubrique par rubrique, et se copie d'un clic dans le CRM.
2. **Les consignes d'origine** du code passent en français, identiques au
   caractère près à celles que le super admin a publiées en production le 24
   septembre (messages D4, D5 et D6 du document des prompts).
3. **L'e-mail de suivi** reçoit la date du rendez-vous, et sa consigne
   n'invente plus de date.
4. **Le super admin** retrouve la consigne d'origine d'un bouton, et
   l'éditeur ne s'ouvre plus sur un texte de service.
5. **Le test des colonnes** passe sous Windows.

80b, codé le 24 septembre (`NOTE-LOT-80B.md`) :

6. **Chaque manager** modifie les consignes de son organisation dans
   Paramètres, Coach IA, avec « Réinitialiser » et la date de la
   modification. La consigne du super admin devient la consigne d'origine.

## 2. Le compte rendu de visite (80a, codé)

**Le principe.** Le modèle ne rédige plus le compte rendu. Il rend une
extraction structurée du transcript (`visitReportExtractionSchema`, dans
`src/core/domain/visit-report-zod.ts`), et le produit assemble le texte
(`composeVisitReport`, dans `src/core/domain/visit-report.ts`) avec ce que la
base sait déjà : la fiche du rendez-vous, l'historique du contact, les
analyses SONCAS et DISC, la grille. Le schéma n'a aucun champ facultatif :
une chaîne vide ou une liste vide veut dire « rien dans le transcript », et la
rubrique écrit alors qu'elle n'a pas été abordée, au lieu d'être remplie.
Les plafonds de longueur du schéma sont larges exprès : le schéma les
vérifie après coup, et un seul dépassement ferait perdre tout le compte
rendu au profit du texte de secours.

**Les rubriques, dans l'ordre, et d'où elles viennent.**

| Rubrique                                                                                                                | Source                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| En-tête : entreprise (ou nom du contact), date, type, durée, potentiel estimé                                           | la fiche du rendez-vous                                  |
| Participants : côté client, côté organisation, personnes citées mais absentes                                           | l'extraction ; à défaut, le contact et le commercial     |
| Historique du compte : jusqu'à cinq rendez-vous antérieurs avec le même contact, avec le score de leur grille           | la base                                                  |
| En une phrase                                                                                                           | l'extraction                                             |
| Trois à six thèmes, avec les mots exacts du prospect                                                                    | l'extraction ; les citations du commercial sont écartées |
| Périmètre et volumétrie, Concurrence et alternatives                                                                    | l'extraction, seulement quand le sujet est venu          |
| Objections et réponses apportées                                                                                        | l'extraction                                             |
| Profil de l'interlocuteur : leviers SONCAS classés, style DISC, comment lui parler, ce qu'il vaut mieux éviter          | les analyses SONCAS et DISC                              |
| Maturité de l'affaire : sept jalons (B2, B3, B5, C1, C3, C4, D1), acquis, partiels ou à obtenir                         | la grille                                                |
| Engagements pris pendant le rendez-vous                                                                                 | l'extraction                                             |
| Prochain rendez-vous, Prochaines étapes                                                                                 | l'extraction                                             |
| Ce qui n'a pas été couvert, et la question à poser                                                                      | la grille (« Où gagner des points »)                     |
| Qualité du rendez-vous : score, blocs, point de vigilance, à conserver, à élever d'un niveau, à arrêter, question, défi | la grille                                                |
| Note de méthode                                                                                                         | un texte fixe, `VISIT_REPORT_METHOD_NOTE`                |

**Le transcript lu** passe de 8 000 à 60 000 caractères
(`VISIT_REPORT_TRANSCRIPT_MAX_CHARS`). À 8 000, le compte rendu d'un
rendez-vous d'une heure s'écrivait sur son premier quart, et la fin, où se
décident la suite et les engagements, n'y figurait jamais.

**Quand il s'écrit.** En arrière-plan, à la fin des quatre analyses, et il
est enregistré dans `Meeting.visitReportDraft`. Relancer les analyses
l'efface et le réécrit ; modifier le rendez-vous aussi, puisque le texte
reprend la fiche. La fiche n'appelle jamais le modèle pendant son affichage :
s'il manque le compte rendu d'un rendez-vous analysé, elle montre le texte
indicatif et le fait écrire après la réponse (`after`,
`meetingVisitReportForPage`). Les rendez-vous analysés avant le lot gardent
leur ancien texte tant qu'ils ne sont ni modifiés ni réanalysés.

**Ce que chacun peut lire.** La grille et le coaching d'un rendez-vous ne se
lisent que par le commercial assigné et les managers. Pour les autres
membres, la page retire du compte rendu, côté serveur, la maturité de
l'affaire, ce qui n'a pas été couvert, la qualité du rendez-vous et les
scores de l'historique (`visitReportWithoutSellerCoaching`). Dans
l'historique, le score d'un rendez-vous mené par un collègue n'est jamais
repris, même pour le commercial assigné.

**La consigne.** `DEFAULT_MEETING_DETAIL_SYNTHESIS_MARKDOWN` (« Compte-rendu
fiche RDV » dans le super admin) décrit chaque champ du schéma, et un test
vérifie qu'aucun n'y manque : un champ ajouté au schéma sans être décrit
reviendrait vide, ou rempli au hasard. Aucune version de cette consigne n'est
publiée en production, c'est donc celle du code qui sert. Ne pas en publier
une ancienne : elle décrirait des champs qui n'existent plus.

**L'écran** (`components/organisms/meeting-synthesis-section.tsx`). Titre
« Compte rendu de visite », sous-titre « Prêt à coller dans votre CRM. Le
rendez-vous est documenté en un clic. », bouton « Copier le compte rendu »
qui devient « Compte rendu copié ». Le texte affiché est exactement le texte
copié : les titres de rubrique sont en capitales dans le texte même, l'écran
les met seulement en couleur. Au-delà de quatorze lignes, le bloc est replié
avec « Tout afficher » et « Replier ». En pied, le nombre de caractères.

**Écarts à la maquette.** La maquette montre un compte rendu écrit à la main
pour un rendez-vous fictif ; ici, chaque rubrique est remplie par le modèle à
partir du vrai transcript, donc la formulation varie d'un rendez-vous à
l'autre et une rubrique sans matière dit « non abordé ». La recette note les
écarts visibles ; ceux qui gênent se corrigent au lot suivant, le 80b
n'ayant reçu aucun retour de recette sur le compte rendu.

## 3. Les consignes d'origine (80a, codé)

`lib/default-analysis-prompts.ts` porte en français les consignes SONCAS,
DISC, KISS, grille et e-mail de suivi, identiques aux versions publiées en
production (analyses en version 4 depuis D5, mail en version 4 avec D6). Les quatre consignes d'analyse finissent sur les règles
d'écriture de Sales Time (`STYLE_SALES_TIME_MARKDOWN`) : un verbe conjugué
dans chaque phrase, des suggestions plutôt que des ordres, des questions
écrites comme on les dit, aucune rubrique remplie sans matière, et des
exemples qui montrent une forme, jamais un fait à reprendre. Les clés du
format de réponse restent en anglais : ce sont celles que le schéma attend.

**La leçon du 24 septembre.** Au premier essai en production, le mail de
suivi annonçait un « vendredi 12 mai » absent du transcript : la date venait
de l'exemple de la consigne. Trois parades, gardées par des tests dans
`lib/default-analysis-prompts.test.ts` :

- aucune consigne ne contient de date précise qu'un modèle pourrait
  recopier ;
- chaque consigne dit que ses exemples montrent une forme ;
- la date du rendez-vous est transmise au mail, dans un bloc `<meeting>`
  (date longue en français, heure de Paris, prospect, entreprise, type ; voir
  `meetingContextBlock` dans `src/core/application/generate-follow-up-email.ts`),
  et la consigne interdit d'en déduire d'autres dates.

Le deuxième essai (D5) n'inventait plus de date, mais faisait prendre au
commercial une mise en relation que la prospect avait proposé de faire,
citait ses objectifs sans leurs chiffres et coupait « en fin de matinée »
d'une date. La consigne du mail (D6) demande donc toutes les étapes
convenues, chacune avec la personne qui s'y est engagée, une démarche
proposée par le prospect qui lui est demandée, ses objectifs avec leurs
chiffres et leurs échéances, des dates entières, rien de promis au-delà de
ce que le commercial a dit, la formule d'appel seule sur sa ligne, et pas de
nom quand aucune signature n'est réglée. Les espaces laissées en fin de
ligne par le modèle sont retirées à l'assemblage du mail.

**La règle pour la suite.** Une consigne changée en production par le super
admin se recopie dans le code au lot suivant. Sinon, le bouton « Consigne
d'origine » ramène un texte périmé.

## 4. Le super admin (80a, codé)

Dans Configuration, Prompts IA, un bouton « Consigne d'origine » remet dans le
brouillon le texte du code, sans rien publier ; il reste grisé quand le
brouillon est déjà ce texte. Sans version publiée, l'éditeur s'ouvre sur la
consigne d'origine, celle que les analyses emploient déjà, et non plus sur
« Aucun prompt : exécutez npx prisma db seed », qu'une publication distraite
aurait installé comme consigne de toutes les organisations.

## 5. Les consignes par organisation (80b, codé)

**Le besoin** (point 27 de la revue du 8 septembre, maquette, Paramètres,
Coach IA). Chaque manager ajuste le rôle et le ton du coach pour son
organisation, sans toucher aux autres organisations. Les échelles, la grille,
la règle de preuve et la règle anti-invention restent garanties par le
produit : elles s'ajoutent autour de la consigne à chaque analyse, quelle
que soit la consigne.

**Les six consignes concernées** : Scorecard (grille de découverte, type
`SCORECARD`), SONCAS, DISC, KISS, Compte rendu de visite
(`MEETING_DETAIL_SYNTHESIS`), E-mail de suivi (`FOLLOW_UP_EMAIL`). Le
briefing et les synthèses du manager restent globales. Le modèle d'IA reste
choisi par le super admin, pour toutes les organisations.

### 5.1 Les données

Une migration additive, nommée `YYYYMMDDHHMMSS_organization_prompt_version` :

```prisma
model OrganizationPromptVersion {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  kind           AnalysisKind
  /// Le texte enregistré par le manager ; null quand il a réinitialisé.
  markdown       String?      @db.Text
  /// Null quand l'auteur a été supprimé par le super admin : la ligne reste.
  authorUserId   String?
  author         User?        @relation(fields: [authorUserId], references: [id], onDelete: SetNull)
  createdAt      DateTime     @default(now())
  analyses       MeetingAnalysis[]

  @@index([organizationId, kind, createdAt])
}
```

L'auteur est facultatif, et non `Restrict` comme prévu d'abord : le super
admin supprime définitivement un utilisateur, et la suppression d'un manager
qui a modifié une consigne aurait échoué. La migration s'appelle
`20260924120000_organization_prompt_version`.

Et une colonne facultative sur `MeetingAnalysis` :
`organizationPromptVersionId String?`, reliée à `OrganizationPromptVersion`
avec `onDelete: SetNull` et un index, pour savoir après coup quelle consigne
a produit une analyse. `promptVersionId` reste obligatoire et continue de
pointer vers la version du super admin.

Rien ne se modifie ni ne s'efface : chaque enregistrement et chaque
réinitialisation ajoutent une ligne. La consigne en vigueur est la dernière
ligne de l'organisation pour ce type.

### 5.2 La règle de résolution

Pour chacune des six consignes, au moment d'une analyse :

1. la dernière ligne de l'organisation pour ce type, si son texte n'est pas
   nul ;
2. sinon, la version courante du super admin ;
3. sinon, la consigne du code.

Un cas d'usage unique porte cette règle, par exemple
`resolveAnalysisPrompt({ kind, organizationId })`, qui rend le texte,
l'identifiant de la version du super admin et celui de la version de
l'organisation. Il remplace `loadAnalysisPromptMarkdown` dans
`run-meeting-analysis` (quatre analyses), `summarize-meeting-detail` et
`generate-follow-up-email`. Un port `OrganizationPromptRepositoryPort` et son
adaptateur Prisma lisent et écrivent la table. Le journal des appels
(`AiRequestLog.promptVersion`) note la version de l'organisation quand elle a
servi.

### 5.3 L'écran : Paramètres, Coach IA

En tête de page, le texte de la maquette : « Les consignes du coach, méthode
par méthode. Le rôle et le ton s'éditent, les échelles, les règles de preuve
et la règle anti-invention sont garanties par le produit. »

Puis l'encart : « **Une consigne modifiée ne s'applique qu'aux rendez-vous
analysés après son enregistrement.** Les analyses déjà faites ne bougent
pas. Si les comptes rendus deviennent étranges après une modification,
« Réinitialiser » remet la consigne d'origine de Sales Time pour les
prochaines analyses. »

Puis six cartes, sur deux colonnes, avec les descriptions de la maquette :

| Carte                                | Description                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scorecard, rendez-vous de découverte | 25 critères en 5 blocs, niveaux 0 à 4. La grille, l'échelle des niveaux et la règle de preuve sont ajoutées par le produit et ne s'éditent pas ici.                      |
| SONCAS                               | Six leviers notés sur 100, citations obligatoires au-dessus de 19 (`PROFILE_SCORE_UNPROVEN_MAX`). L'échelle de preuves est ajoutée automatiquement.                      |
| DISC                                 | Quatre styles notés sur 100, indépendants, chacun avec ses propres preuves. Même règle que SONCAS.                                                                       |
| KISS                                 | Ce qu'il faut garder, améliorer, arrêter et démarrer. Chaque puce s'appuie sur un moment du transcript et propose un geste pour le prochain rendez-vous.                 |
| Compte rendu de visite               | Le texte prêt à coller dans le CRM. Les sections sont imposées, et une rubrique sans information dans le transcript est signalée comme non abordée plutôt que complétée. |
| E-mail de suivi                      | Rédigé pour le prospect, dans le ton et l'adresse choisis dans l'onglet E-mail de suivi.                                                                                 |

Chaque carte porte « Modifier la consigne », « Réinitialiser » (grisé, avec
l'infobulle « Cette consigne est déjà celle d'origine de Sales Time », quand
la consigne n'est pas modifiée), et une pastille : « Modifiée le 24
septembre 2026 » (infobulle « Modifiée par Prénom Nom ») ou « Consigne
d'origine, version 4 », le numéro étant celui de la version du super admin
(« Consigne d'origine » seul quand il n'en a publié aucune).

« Modifier la consigne » ouvre une fenêtre : le titre de la carte, la phrase
« Le rôle et le ton s'éditent librement. La grille, les échelles et la règle
de preuve sont ajoutées par le produit à chaque analyse : elles ne peuvent
pas diverger de ce que le produit calcule. », la consigne en vigueur dans une
zone de texte, la note « Votre modification ne s'appliquera qu'aux
rendez-vous analysés après l'enregistrement. Les analyses déjà faites gardent
leur compte rendu. », et trois boutons : « Réinitialiser », « Annuler »,
« Enregistrer en nouvelle version ». Messages de confirmation : « Consigne
enregistrée en nouvelle version. Elle s'applique aux prochaines analyses. »
et « Consigne d'origine de Sales Time rétablie. Elle s'applique aux
prochaines analyses. »

Une consigne vide ne s'enregistre pas (« La consigne ne peut pas être
vide. »), ni une consigne de plus de 20 000 caractères.

Les quatre champs actuels de la page (pitch, objections, arguments clés,
vocabulaire) restent en dessous, inchangés, sous le titre « Votre
argumentaire ». C'est un écart à la maquette, où ils n'y sont pas : le lot 81
les range avec le playbook.

### 5.4 Les droits

Seul qui peut modifier les réglages de l'organisation (`orgSettingsCanEdit`)
enregistre ou réinitialise ; les autres voient la page en lecture seule, avec
le bandeau habituel. L'organisation vient toujours de la session, jamais du
formulaire. Chaque enregistrement et chaque réinitialisation écrivent une
ligne au journal d'audit (`logPlatformAction`, actions
`ORG_PROMPT_UPDATED` et `ORG_PROMPT_RESET`). L'éditeur du super admin ne
change pas : il règle la consigne d'origine de toutes les organisations.

### 5.5 Les tests

- La résolution : consigne de l'organisation, puis du super admin, puis du
  code ; une réinitialisation (texte nul) ramène à la consigne d'origine ;
  un type hors des six ignore les lignes de l'organisation.
- L'isolement : la consigne de l'organisation A ne sert jamais à
  l'organisation B.
- Une analyse faite avec une consigne d'organisation enregistre
  `organizationPromptVersionId` ; les analyses déjà faites ne changent pas.
- Les enrobages du code (échelles, grille, typographie, compétences du
  commercial) sont présents autour d'une consigne d'organisation.
- L'action refuse un texte vide, un texte trop long, et un membre sans droit
  de modification.

### 5.6 Critères d'acceptation et recette

- [ ] Paramètres, Coach IA montre les six cartes, l'encart et la pastille
      « Consigne d'origine, version N » partout avant toute modification.
- [ ] Modifier SONCAS (par exemple ajouter « Termine le résumé par la phrase :
      consigne de test. »), enregistrer : la pastille devient « Modifiée le
      … », le message de confirmation s'affiche.
- [ ] Un rendez-vous analysé ensuite porte la phrase dans son résumé SONCAS ;
      dans le super admin, Logs IA, la consigne envoyée la contient. Un
      rendez-vous analysé avant ne change pas.
- [ ] Une autre organisation, analysée au même moment, ne la porte pas.
- [ ] « Réinitialiser » : la pastille revient à « Consigne d'origine,
      version N », et l'analyse suivante n'a plus la phrase.
- [ ] Un commercial sans droit voit la page en lecture seule.
- [ ] Le journal d'audit du super admin montre les deux actions.
- [ ] La migration passe sur la branche Neon dev avec `npx prisma migrate
deploy`, jamais ailleurs, et `npm run build` passe.

### 5.7 Ce que le code a précisé

Le détail est dans `NOTE-LOT-80B.md`, section 2. En bref : un texte
identique à celui en vigueur n'ajoute pas de version, pour ne pas figer la
consigne d'origine du jour ; « Réinitialiser » se confirme d'un second
clic ; la fenêtre ne se ferme pas sur un clic à côté et demande de confirmer
l'abandon d'un texte modifié ; l'action refuse d'écrire si l'organisation
active a changé dans un autre onglet ; les membres sans droit voient l'état
des consignes, pas leur texte ; la carte DISC ne promet pas de preuves par
style, que le schéma DISC n'a pas ; le journal des appels écrit
`org:<identifiant>` quand la consigne de l'organisation a servi.
