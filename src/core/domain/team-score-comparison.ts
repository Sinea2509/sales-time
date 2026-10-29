/**
 * Les scores auxquels comparer un rendez-vous pour « Vs moyenne de
 * l'équipe » : ceux des rendez-vous de son équipe, c'est-à-dire du manager du
 * commercial et des commerciaux qui lui sont rattachés.
 *
 * Sans équipe déclarée, ou quand personne d'autre dans l'équipe n'a de score
 * sur la période, il n'y a rien à quoi se comparer : la fonction rend `null`
 * et la ligne disparaît, plutôt que de comparer le commercial à toute
 * l'organisation, ou à lui-même (retour de Thomas du 29 octobre 2026).
 */
export function teamScoresForComparison(
  meetings: readonly { sellerUserId: string; salesScore: number | null }[],
  input: { sellerUserId: string; teamUserIds: readonly string[] | undefined },
): number[] | null {
  if (!input.teamUserIds) return null;
  const team = new Set(input.teamUserIds);
  const scored = meetings.filter(
    (m): m is { sellerUserId: string; salesScore: number } =>
      team.has(m.sellerUserId) && typeof m.salesScore === "number",
  );
  if (!scored.some((m) => m.sellerUserId !== input.sellerUserId)) return null;
  return scored.map((m) => m.salesScore);
}
