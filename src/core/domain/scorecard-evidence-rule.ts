import type { ScorecardGrid } from "./scorecard-grid";
import type { ScorecardLeveledResult } from "./scorecard-result-zod";
import { evidenceWords, isExcerptInSource } from "./transcript-evidence";

/**
 * Le niveau le plus haut qu'un critère garde sans preuve retrouvée.
 *
 * La consigne de la grille dit qu'aucun niveau au-dessus de 0 ne se donne sans
 * citation. Le produit ne descend pas pour autant à 0 : on sait que la preuve
 * manque, on ne sait pas que le geste a manqué, et un modèle qui a paraphrasé
 * au lieu de recopier a peut-être vu juste. Le niveau 1 dit exactement cela :
 * un signe, rien qui le prouve. C'est le même raisonnement que la règle SONCAS,
 * qui ramène un levier sans preuve dans sa première tranche plutôt qu'à zéro.
 */
export const SCORECARD_UNPROVEN_LEVEL_MAX = 1;

/**
 * « Pas de preuve retrouvée, pas de note haute » : la règle de la grille.
 *
 * Chaque extrait cité en preuve doit se retrouver dans le transcript ou les
 * notes, à quelques fautes près (voir `transcript-evidence.ts`). Un extrait
 * introuvable est retiré : une définition du critère, une phrase reformulée,
 * une citation inventée ne s'affichent plus comme des preuves. Un critère qui
 * n'a plus aucune preuve est ramené au niveau 1 s'il était plus haut.
 *
 * La règle s'applique à l'écriture, avant le calcul du score et
 * l'enregistrement, jamais à la lecture : une analyse déjà en base garde ce
 * qu'elle annonçait. Le journal des appels garde, lui, ce que le modèle a
 * rendu. Un résultat où rien n'est à corriger ressort identique.
 */
export function applyScorecardEvidenceRule<T extends ScorecardLeveledResult>(
  result: T,
  sourceText: string,
): T {
  const sourceWords = evidenceWords(sourceText);
  let changed = false;
  const criteria = result.criteria.map((criterion) => {
    const evidence = criterion.evidence.filter((excerpt) =>
      isExcerptInSource(excerpt, sourceWords),
    );
    const level =
      evidence.length === 0 && criterion.level > SCORECARD_UNPROVEN_LEVEL_MAX
        ? SCORECARD_UNPROVEN_LEVEL_MAX
        : criterion.level;
    if (
      evidence.length === criterion.evidence.length &&
      level === criterion.level
    ) {
      return criterion;
    }
    changed = true;
    return { ...criterion, evidence, level };
  });
  return changed ? { ...result, criteria } : result;
}

/**
 * Ne garde que les clés de la grille.
 *
 * Le modèle invente parfois une clé (« A6 » pour un critère qu'il range mal) :
 * le calcul du score l'ignore déjà, mais « Où gagner des points » l'affichait
 * telle quelle. Une entrée sur une clé inconnue ne dit rien au commercial ; elle
 * disparaît, dans `criteria` comme dans `pointsLost`.
 */
export function keepKnownScorecardKeys<T extends ScorecardLeveledResult>(
  result: T,
  grid: ScorecardGrid,
): T {
  const known = new Set(
    grid.blocks.flatMap((block) => block.criteria.map((c) => c.key)),
  );
  const criteria = result.criteria.filter((c) => known.has(c.key));
  const pointsLost = result.pointsLost.filter((p) => known.has(p.key));
  if (
    criteria.length === result.criteria.length &&
    pointsLost.length === result.pointsLost.length
  ) {
    return result;
  }
  return { ...result, criteria, pointsLost };
}
