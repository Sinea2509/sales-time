const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * Écrit un pourcentage à la française : virgule décimale et espace insécable
 * avant le signe, « 62,5 % » et non « 62.5% ».
 *
 * Prend la valeur déjà exprimée en pourcentage (62,5 pour 62,5 %), parce que
 * c'est sous cette forme que le domaine la calcule et la stocke.
 */
export function formatPercentFr(value: number): string {
  return percentFormat.format(value / 100);
}
