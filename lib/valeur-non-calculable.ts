/**
 * Marqueur des valeurs non calculables.
 *
 * Une case vide remplie d'un tiret ne dit pas si c'est zéro, une absence de
 * donnée ou un bogue. Le produit écrit « n. c. » et met la raison dans l'infobulle
 * de la case, pour que le manager sache toujours quoi conclure.
 */
export const VALEUR_NON_CALCULABLE = "n. c.";

/** Infobulle par défaut, à remplacer par une raison plus précise quand elle existe. */
export const VALEUR_NON_CALCULABLE_TITRE =
  "Non calculable : aucune donnée sur la période.";
