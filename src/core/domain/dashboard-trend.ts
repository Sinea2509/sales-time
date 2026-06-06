/** Variation % période courante vs période précédente (même durée). */
export function percentChangeVsPrevious(
  current: number,
  previous: number,
): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round((100 * (current - previous)) / previous);
}
