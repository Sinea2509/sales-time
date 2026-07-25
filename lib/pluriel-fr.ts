/**
 * Marque du pluriel en français : elle apparaît à partir de 2, pas à partir de 1.
 *
 * « 1 point », « 1,5 point », puis « 2 points ». Un écran qui écrit « 1 pts »
 * signale au lecteur que personne n'a relu la phrase, et ce doute-là se
 * transporte ensuite sur les chiffres eux-mêmes.
 *
 * La règle porte sur la valeur absolue : une baisse de 2 points reste deux
 * points. Elle porte aussi sur la valeur *affichée*, arrondie, et non sur la
 * valeur brute : c'est le nombre écrit à côté du mot qui commande son pluriel.
 */
export function plurielFr(
  magnitudeAffichee: number,
  singulier: string,
  pluriel = `${singulier}s`,
): string {
  return Math.abs(magnitudeAffichee) >= 2 ? pluriel : singulier;
}
