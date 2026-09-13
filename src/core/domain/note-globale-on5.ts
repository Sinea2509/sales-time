/** Moyenne SalesScore (0–100) convertie sur une échelle /5 (arrondi à 0,1). */
export function noteGlobaleOn5FromSalesScores(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  return Math.round((avg / 20) * 10) / 10;
}

/**
 * La même moyenne, laissée sur 100 et arrondie à l'entier.
 *
 * C'est le chiffre que lit le commercial : la revue du 2 septembre a réservé
 * la note sur 5 au manager, qui classe son équipe avec, et rendu au commercial
 * le SalesScore tel qu'il le voit sur chaque rendez-vous. Les deux fonctions
 * partent des mêmes scores, si bien qu'un commercial et son manager lisent
 * bien la même personne, à deux échelles.
 */
export function salesScoreAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length);
}
