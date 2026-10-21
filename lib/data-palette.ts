/**
 * La palette des données, une seule pour tout le produit.
 *
 * Audit du tableau de bord du 21 octobre 2026 : cinq systèmes de couleur
 * cohabitaient sur la même page, et la plupart ne voulaient rien dire. La
 * règle est désormais simple : le violet de la marque pour une donnée neutre,
 * et un code de niveau dès que la couleur porte un jugement. Les teintes sont
 * celles de la charte, et des visuels 3D.
 */
export const DATA_COLORS = {
  neutral: "#6C4DFF",
  low: "#FF7A6B",
  mid: "#FFB547",
  high: "#33D1B5",
} as const;

/** Sous ce niveau (sur 100), la couleur dit « en retrait ». */
export const LEVEL_LOW_BELOW = 60;
/** À partir de ce niveau (sur 100), la couleur dit « solide ». */
export const LEVEL_HIGH_FROM = 75;

/**
 * La couleur d'un niveau sur 100 : corail sous 60, ambre de 60 à 74,
 * turquoise à partir de 75.
 */
export function levelColor(level: number): string {
  if (level < LEVEL_LOW_BELOW) return DATA_COLORS.low;
  if (level < LEVEL_HIGH_FROM) return DATA_COLORS.mid;
  return DATA_COLORS.high;
}
