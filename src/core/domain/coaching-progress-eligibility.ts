/** Minimum analyzed RDV count before progress coaching bullets are shown. */
export const MIN_ANALYZED_RDV_FOR_PROGRESS = 2;

export function coachingProgressBulletsForDisplay(
  analyzedRdvCount: number,
  bullets: string[],
): string[] {
  if (analyzedRdvCount < MIN_ANALYZED_RDV_FOR_PROGRESS) return [];
  return bullets;
}
