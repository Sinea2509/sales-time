import { soncasResultSchema } from "./analysis-result-zod";
import { scorecardResultSchema } from "./scorecard-result-zod";

/**
 * Le SalesScore d'un rendez-vous : la note de la grille, sur 100, comme la
 * maquette du 11 septembre l'annonce (« sur 100, grille rendez-vous de
 * découverte »).
 *
 * La moyenne des six leviers SONCAS ne sert plus que de repli, pour un
 * rendez-vous noté avant la grille ou dont la grille a échoué : un rendez-vous
 * analysé garde ainsi un score, et le classement ne perd personne.
 */
export function salesScoreForMeeting(input: {
  scorecardResult: unknown;
  soncasResult: unknown;
}): number | null {
  const scorecard = scorecardResultSchema.safeParse(input.scorecardResult);
  if (scorecard.success) return Math.round(scorecard.data.overallScore);
  return salesScoreFromSoncasResult(input.soncasResult);
}

/** Score 0–100 à partir du dernier résultat SONCAS (moyenne des 6 leviers), le repli sans grille. */
export function salesScoreFromSoncasResult(result: unknown): number | null {
  const parsed = soncasResultSchema.safeParse(result);
  if (!parsed.success) return null;
  const d = parsed.data.drivers;
  const scores = [
    d.securite.score,
    d.orgueil.score,
    d.nouveaute.score,
    d.confort.score,
    d.argent.score,
    d.sympathie.score,
  ];
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
