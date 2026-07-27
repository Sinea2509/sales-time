/**
 * Proprietary meeting metric (0–100), derived from the average of SONCAS driver scores.
 * Use only for `salesScore` / aggregated SalesScore KPIs, not for KISS coaching (0–10),
 * DISC/SONCAS profile percentages, or other framework-specific scores.
 */
export const SALES_SCORE_LABEL = "SalesScore";

/** KISS coaching performance on a single meeting (0–10). Not a SalesScore. */
export const KISS_COACHING_SCORE_LABEL = "Score KISS";

/** Tailwind text color for a nude SalesScore (0–100). */
export function salesScoreColorClass(score: number): string {
  if (score < 50) return "text-red-600 dark:text-red-400";
  if (score < 70) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/**
 * Le remplissage d'une barre de SalesScore, aux mêmes seuils que le texte.
 *
 * Une barre et un chiffre qui décrivent le même score doivent en dire la même
 * chose : une barre de marque sous un 47 écrit en rouge racontait deux
 * histoires. Les trois remplissages tiennent le seuil de 3:1 exigé d'un
 * composant graphique sur fond blanc : rouge 4,83:1, ambre 3,19:1, vert
 * 3,77:1, mesurés sur le thème clair, seul thème optimisé.
 */
export function salesScoreBarClass(score: number): string {
  if (score < 50) return "bg-red-600 dark:bg-red-500";
  if (score < 70) return "bg-amber-600 dark:bg-amber-500";
  return "bg-emerald-600 dark:bg-emerald-500";
}
