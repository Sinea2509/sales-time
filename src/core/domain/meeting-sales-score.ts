import { scorecardResultSchema } from "./scorecard-result-zod";

/**
 * Le SalesScore d'un rendez-vous : la note de sa scorecard, sur 100.
 *
 * C'est la note de ce qu'on attend d'un rendez-vous, critère par critère,
 * sur la grille de son type : 25 critères en 5 blocs pour la découverte,
 * additionnés par le produit lui-même. Il valait jusqu'ici la moyenne des six
 * leviers SONCAS, c'est-à-dire un portrait du prospect posé sur la ligne du
 * commercial : un acheteur enthousiaste faisait un bon score, quoi que le
 * commercial ait obtenu. Les deux lectures sont maintenant séparées : SONCAS
 * décrit le prospect, le SalesScore note le rendez-vous.
 *
 * Un rendez-vous dont le type n'a pas de grille n'a pas de SalesScore : la
 * case dit « n. c. », et ne se remplit pas d'une autre mesure à sa place.
 */
export function salesScoreFromScorecardResult(result: unknown): number | null {
  const parsed = scorecardResultSchema.safeParse(result);
  if (!parsed.success) return null;
  return Math.round(parsed.data.overallScore);
}

/** Le SalesScore parmi les analyses d'un rendez-vous, quel que soit leur ordre. */
export function salesScoreFromAnalyses(
  analyses: ReadonlyArray<{ kind: string; result: unknown }>,
): number | null {
  const scorecard = analyses.find((a) => a.kind === "SCORECARD");
  return scorecard ? salesScoreFromScorecardResult(scorecard.result) : null;
}
