/**
 * La courbe d'un SalesScore dans le temps : un point par rendez-vous noté,
 * du plus ancien au plus récent.
 *
 * Elle sert un trait de quelques centimètres à côté d'une moyenne, et ce
 * trait ne peut pas porter cent points : au-delà de `maxPoints`, les
 * rendez-vous sont groupés en tranches d'égale longueur dont on garde la
 * moyenne, si bien que la courbe garde sa forme sans devenir un bruit.
 */
/** Une date absente d'un jeu d'essai vaut le plus ancien, jamais une erreur. */
const timeOf = (d: Date | undefined): number =>
  d instanceof Date ? d.getTime() : 0;

export function salesScoreSeries(
  meetings: readonly { meetingAt: Date; salesScore: number | null }[],
  maxPoints = 12,
): number[] {
  const scored = meetings
    .filter(
      (m): m is { meetingAt: Date; salesScore: number } => m.salesScore != null,
    )
    .sort((a, b) => timeOf(a.meetingAt) - timeOf(b.meetingAt))
    .map((m) => m.salesScore);
  if (scored.length <= maxPoints) return scored;

  const out: number[] = [];
  const size = scored.length / maxPoints;
  for (let i = 0; i < maxPoints; i += 1) {
    const from = Math.floor(i * size);
    const to = i === maxPoints - 1 ? scored.length : Math.floor((i + 1) * size);
    const slice = scored.slice(from, Math.max(to, from + 1));
    out.push(Math.round(slice.reduce((a, x) => a + x, 0) / slice.length));
  }
  return out;
}
