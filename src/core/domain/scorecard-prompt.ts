import {
  SCORECARD_EXPLORED_LABEL,
  SCORECARD_OBTAINED_LABEL,
  scorecardLevelFromCoverage,
} from "./scorecard-coverage";
import { SCORECARD_LEVEL_MAX, type ScorecardGrid } from "./scorecard-grid";
import { SCORECARD_EXPLORED, SCORECARD_OBTAINED } from "./scorecard-result-zod";

/**
 * La partie non modifiable de la consigne scorecard, écrite depuis la grille.
 *
 * Le super-admin édite le rôle, le ton et la description des champs de
 * coaching. Il n'édite pas ce bloc : il porte la liste exacte des clés que le
 * schéma attend, ce que chaque critère cherche, et la façon de faire le relevé
 * dont le produit tire les niveaux. Le texte se fabrique à partir de la
 * grille, à chaque appel, et ne peut donc pas la contredire.
 *
 * Depuis la revue du 5 octobre 2026, le modèle ne note plus : il relève, pour
 * chaque critère, si le commercial a exploré le thème et ce qu'il a obtenu.
 * Le produit en déduit le niveau par une table fixe.
 */
export function scorecardGridInstruction(grid: ScorecardGrid): string {
  const blocs = grid.blocks
    .map((block) => {
      const lignes = block.criteria
        .map((criterion) => {
          const parts = [
            `- **${criterion.key}** ${criterion.label}.`,
            criterion.lookFor ? `  Ce qui compte : ${criterion.lookFor}` : null,
            `  Niveau ${SCORECARD_LEVEL_MAX} : ${criterion.expected}`,
            criterion.examples?.length
              ? `  Formulations possibles, parmi d'autres : ${criterion.examples
                  .map((e) => `« ${e} »`)
                  .join(" ; ")}`
              : null,
            criterion.measuredByProduct
              ? "  Mesuré par le produit : renseigne seulement `learned` et `missing` à partir de la mesure donnée plus bas."
              : null,
            criterion.requiresFigure
              ? "  Chiffre exigé : le niveau 4 demande un nombre dit par le prospect, cité dans `evidence`."
              : null,
            criterion.canBeUnobservable
              ? "  Peut être non observable : si le transcript commence après ce moment (l'enregistrement a démarré en cours de rendez-vous), mets `observable` à false."
              : null,
          ];
          return parts.filter(Boolean).join("\n");
        })
        .join("\n");
      return `### ${block.key}. ${block.name} (${block.weight} points)\n${lignes}`;
    })
    .join("\n\n");

  const table = SCORECARD_OBTAINED.map(
    (obtained) =>
      `| ${obtained} | ${SCORECARD_EXPLORED.map((explored) =>
        scorecardLevelFromCoverage(explored, obtained),
      ).join(" | ")} |`,
  ).join("\n");

  return `## Grille : ${grid.name}
${grid.intent}
${grid.notExpected ? `\n${grid.notExpected}\n` : ""}
## Ta tâche sur la grille : un relevé, pas une note
Tu ne donnes aucun niveau ni aucun score. Pour chaque critère ci-dessous, tu relèves ce qui s'est passé dans le rendez-vous. Le produit en déduit le niveau, toujours de la même façon.

**Le thème compte, pas la formulation.** Une question posée avec d'autres mots que les exemples compte pleinement. Une information obtenue à n'importe quel moment compte, même si elle arrive en réponse à une autre question ou si le prospect la donne de lui-même. Lis le transcript en entier avant de répondre : les informations décisives arrivent souvent dans la deuxième moitié du rendez-vous (prix, décision, prochaine étape).

Pour chaque critère :
- **explored**, ce que le commercial a fait du thème :
  - \`non\` : ${SCORECARD_EXPLORED_LABEL.non} ; il n'a ni posé de question ni rebondi dessus.
  - \`aborde\` : ${SCORECARD_EXPLORED_LABEL.aborde} ; il a amené le sujet ou rebondi une fois, sans aller plus loin.
  - \`creuse\` : ${SCORECARD_EXPLORED_LABEL.creuse} ; il est revenu dessus, a relancé, reformulé ou demandé un exemple, un chiffre, un nom.
- **obtained**, ce que le prospect a donné sur ce thème, que le commercial l'ait demandé ou non :
  - \`rien\` : ${SCORECARD_OBTAINED_LABEL.rien}.
  - \`partiel\` : une information générale, vague ou incomplète.
  - \`exploitable\` : une information assez précise pour préparer la suite : un nom, un chiffre, une étape, une date, un exemple vécu.
- **learned** : une phrase qui dit ce que le commercial sait maintenant sur ce thème, avec les faits du transcript (noms, chiffres, dates). Vide si rien.
- **missing** : une phrase qui dit ce qui manque encore pour atteindre le niveau ${SCORECARD_LEVEL_MAX}. Vide si rien ne manque.
- **evidence** : 1 à 3 extraits recopiés mot pour mot, chacun avec \`who\` : \`commercial\` ou \`prospect\`, selon la personne qui l'a dit. Donne de préférence la question ou la relance du commercial ET la réponse du prospect. Un extrait est une phrase entière, ou un morceau de phrase qui a du sens seul : ne le coupe jamais au milieu d'une idée. Aucun extrait quand le thème est absent.
- **observable** : \`true\` presque toujours. \`false\` seulement pour un critère marqué « peut être non observable », quand le transcript ne montre pas le moment qu'il juge : le critère sort alors du calcul au lieu de coûter des points. Un thème simplement absent du rendez-vous reste observable : il vaut 0.

Le produit vérifie chaque extrait dans le transcript et qui l'a dit. Un extrait introuvable est retiré. Une information « obtenue » sans parole du prospect retrouvée baisse d'un cran ; un sujet « creusé » sans parole du commercial retrouvée devient « abordé ». Un critère sans aucun extrait ne dépasse pas le niveau 1.

Le niveau que le produit en tire (colonnes : ${SCORECARD_EXPLORED.join(", ")}) :

| obtained | ${SCORECARD_EXPLORED.join(" | ")} |
|---|---|---|---|
${table}

Dans \`criteria\`, chaque critère a son propre champ, nommé par sa clé : remplis-les tous, un par un, en relisant le transcript pour chacun. Un thème absent du rendez-vous se relève \`non\` et \`rien\`, sans extrait ; il n'est jamais laissé de côté.

${blocs}

## Les points perdus
Dans \`pointsLost\`, choisis 3 à 5 critères où le rendez-vous laisse le plus de marge, parmi ceux qui ne sont pas à \`creuse\` + \`exploitable\`, en commençant par ceux qui comptent le plus pour la suite de cette affaire. Pour chacun, \`evidence\` dit ce que le transcript montre à cet endroit, et \`whatToSayInstead\` donne la phrase que le commercial pourrait dire, en français correct et naturel, écrite comme il la dirait à voix haute à ce prospect. Ne suggère jamais ce que le relevé montre déjà fait.`;
}
