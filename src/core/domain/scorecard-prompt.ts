import { libelleTranche, scoreBands } from "./score-bands";
import {
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
  type ScorecardGrid,
} from "./scorecard-grid";

/**
 * La partie non modifiable de la consigne scorecard, écrite depuis la grille.
 *
 * Le super-admin édite le rôle, le ton et la description des champs de sortie.
 * Il n'édite pas ce bloc, et c'est voulu : il porte la liste exacte des clés que
 * le schéma attend, l'échelle des niveaux, l'interdiction de rendre un total et
 * les paliers du produit. Une consigne réécrite qui aurait perdu la liste des
 * critères produirait des clés inventées, que le calcul jetterait sans bruit ;
 * une consigne qui aurait gardé une ancienne liste noterait des critères
 * disparus de la grille. Le texte se fabrique donc à partir de la donnée, à
 * chaque appel, et ne peut pas la contredire.
 *
 * Les paliers ne sont pas écrits non plus : ils viennent de ceux du produit,
 * ramenés sur l'échelle du score. Le modèle les lit pour savoir ce qu'il
 * décide, sans qu'il lui soit demandé de les nommer, puisque le palier affiché
 * au commercial se calcule sur son score.
 */
export function scorecardGridInstruction(grid: ScorecardGrid): string {
  const blocs = grid.blocks
    .map((block) => {
      const lignes = block.criteria
        .map(
          (criterion) =>
            `- **${criterion.key}** ${criterion.label}. Niveau ${SCORECARD_LEVEL_MAX} : ${criterion.expected}`,
        )
        .join("\n");
      return `### ${block.key}. ${block.name} (${block.weight} points)\n${lignes}`;
    })
    .join("\n\n");

  const paliers = scoreBands({ max: SCORECARD_TOTAL, pointsParUnite: 1 })
    .map((band) => `- ${libelleTranche(band)}: ${band.tier.nom}`)
    .join("\n");

  return `## Scorecard : ${grid.name}
${grid.intent}

Rate how well the SELLER covered each criterion in THIS meeting. You rate his work, not the quality of what he sells and not the prospect. The list below is the whole grid: use these keys, all of them, and no others.

${blocs}

Level, criterion by criterion: **${SCORECARD_LEVEL_MAX}** obtained and probed until the answer is usable · **3** obtained but only partly probed · **2** raised and left there, or volunteered by the prospect with no follow-up · **1** barely touched, or a signal the prospect gave and the seller did not pick up · **0** absent from the meeting.

Any level above 0 is earned by words that are in the transcript. Copy them into \`evidence\`, 1 to 3 excerpts, exactly as they were said and in the language of the transcript. Never rewrite a quote and never compose one. No quote means level 0, whatever your impression of the meeting was. When you hesitate between two levels, take the lower one.

Return one entry per criterion in \`criteria\`. Every key you write, there and in \`pointsLost\`, must be one of the keys above. Return no total, no block subtotal and no level name: the product adds your levels itself, on the weights written above, and names the level they reach. A criterion you leave out counts as 0, so leaving one out is a decision and not a shortcut.

The score runs from 0 to ${SCORECARD_TOTAL}, and the seller is shown the level it reaches:

${paliers}

Reaching the top band is exceptional in a real meeting; a meeting that went well and still left clear gaps lands in the middle of the scale. Grading generously is not kindness here. These scores are averaged over months, and a seller placed one level above where he stands is then coached for someone else's problems.`;
}
