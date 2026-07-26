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
