import { scorecardResultSchema } from "./scorecard-result-zod";

/**
 * Le SalesScore d'un rendez-vous : la note de la grille, sur 100, comme la
 * maquette du 11 septembre l'annonce (« sur 100, grille rendez-vous de
 * découverte »).
 *
 * Rien d'autre ne tient lieu de note. La moyenne des six leviers SONCAS a
 * servi de repli jusqu'au lot 92 : c'était un trait du prospect présenté
 * comme une note du commercial, et il entrait dans les moyennes et le
 * classement. Un rendez-vous sans grille lisible n'est pas noté, et la fiche
 * le dit.
 */
export function salesScoreForMeeting(input: {
  scorecardResult: unknown;
}): number | null {
  const scorecard = scorecardResultSchema.safeParse(input.scorecardResult);
  if (scorecard.success) return Math.round(scorecard.data.overallScore);
  return null;
}
