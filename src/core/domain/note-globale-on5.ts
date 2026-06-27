/** Moyenne SalesScore (0–100) convertie sur une échelle /5 (arrondi à 0,1). */
export function noteGlobaleOn5FromSalesScores(
  scores: number[],
): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  return Math.round((avg / 20) * 10) / 10;
}
