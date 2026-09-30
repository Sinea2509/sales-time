/**
 * L'activation : parmi les inscrits d'une période, combien ont analysé au
 * moins un rendez-vous, et au bout de combien de temps.
 *
 * C'est le premier chiffre à regarder quand on cherche pourquoi un essai ne
 * se transforme pas : un inscrit qui n'a jamais analysé n'a jamais vu le
 * produit. La médiane, et non la moyenne, parce qu'un inscrit revenu trois
 * semaines plus tard ne doit pas cacher que les autres ont analysé le jour
 * même.
 */
export type ActivationMetrics = {
  signups: number;
  activated: number;
  /** Nul quand il n'y a aucun inscrit sur la période. */
  activationRatePct: number | null;
  /** Nul tant que personne n'a analysé. Arrondi à l'heure au-dessus. */
  medianHoursToFirstMeeting: number | null;
};

export function activationMetrics(input: {
  signups: ReadonlyArray<{ userId: string; createdAt: Date }>;
  firstMeetings: ReadonlyArray<{ userId: string; at: Date }>;
}): ActivationMetrics {
  const firstMeetingByUser = new Map(
    input.firstMeetings.map((m) => [m.userId, m.at.getTime()]),
  );

  const delaysHours: number[] = [];
  for (const signup of input.signups) {
    const at = firstMeetingByUser.get(signup.userId);
    if (at == null) continue;
    const hours = (at - signup.createdAt.getTime()) / 3_600_000;
    delaysHours.push(Math.max(0, hours));
  }

  const signups = input.signups.length;
  const activated = delaysHours.length;

  return {
    signups,
    activated,
    activationRatePct:
      signups > 0 ? Math.round((activated / signups) * 100) : null,
    medianHoursToFirstMeeting:
      activated > 0 ? Math.ceil(median(delaysHours)) : null,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
