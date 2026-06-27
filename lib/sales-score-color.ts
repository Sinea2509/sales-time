/** Tailwind text color for a nude SalesScore (0–100). */
export function salesScoreColorClass(score: number): string {
  if (score < 50) return "text-red-600 dark:text-red-400";
  if (score < 70) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}
