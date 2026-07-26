export const STATS_WINDOW_DAYS_OPTIONS = [7, 30, 90] as const;

export type StatsWindowDays = (typeof STATS_WINDOW_DAYS_OPTIONS)[number];

/**
 * La fenêtre retenue quand l'adresse n'en nomme aucune.
 *
 * Elle est nommée plutôt qu'écrite en chiffre à chaque emploi, parce que
 * plusieurs endroits ont besoin de savoir laquelle est implicite : les liens
 * qui l'omettent volontairement de l'adresse, et la page qui retire ce
 * paramètre quand il ne dit rien de plus que le défaut.
 */
export const DEFAULT_STATS_WINDOW_DAYS: StatsWindowDays = 30;

/** Seuil minimal de RDV pour afficher tendances KPI et activer une fenêtre stats. */
export const MIN_RDV_FOR_STATS = 5;

export function isStatsWindowEligibleForTrends(nbRdvs: number): boolean {
  return nbRdvs >= MIN_RDV_FOR_STATS;
}

export function disabledStatsWindowDays(
  counts: Record<StatsWindowDays, number>,
): StatsWindowDays[] {
  return STATS_WINDOW_DAYS_OPTIONS.filter(
    (d) => !isStatsWindowEligibleForTrends(counts[d]),
  );
}

/**
 * Aucune fenêtre n'atteint le seuil : le sélecteur de période n'a plus rien à
 * proposer, et un écran qui invite à changer de période propose l'impossible.
 *
 * Le calcul passe par un ensemble plutôt que par une comparaison de longueurs :
 * une liste qui contiendrait deux fois la même fenêtre répondrait autrement.
 */
export function areAllStatsWindowsDisabled(
  disabledDays: readonly StatsWindowDays[],
): boolean {
  const disabled = new Set(disabledDays);
  return STATS_WINDOW_DAYS_OPTIONS.every((d) => disabled.has(d));
}

/** Choisit la première fenêtre éligible (7 → 30 → 90) si la demande est insuffisante. */
export function resolveEligibleStatsWindowDays(
  requested: StatsWindowDays,
  counts: Record<StatsWindowDays, number>,
): StatsWindowDays {
  if (isStatsWindowEligibleForTrends(counts[requested])) return requested;
  for (const d of STATS_WINDOW_DAYS_OPTIONS) {
    if (isStatsWindowEligibleForTrends(counts[d])) return d;
  }
  return requested;
}

export function parseStatsWindowDays(
  raw: string | string[] | undefined,
): StatsWindowDays {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = v != null ? String(v) : "";
  if (s === "7" || s === "30" || s === "90") {
    return Number(s) as StatsWindowDays;
  }
  return DEFAULT_STATS_WINDOW_DAYS;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function meetingAtSinceForStatsWindow(
  days: StatsWindowDays,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - days * MS_PER_DAY);
}

/** Début de la fenêtre KPI précédente (même durée), pour comparaison trend. */
export function previousMeetingAtWindowStart(
  days: StatsWindowDays,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - 2 * days * MS_PER_DAY);
}

/** Split meetings into current stats window vs the immediately preceding window. */
export function partitionMeetingsByStatsWindow<T extends { meetingAt: Date }>(
  meetings: T[],
  days: StatsWindowDays,
  now: Date = new Date(),
): { currentWindow: T[]; previousWindow: T[] } {
  const sinceCurrent = meetingAtSinceForStatsWindow(days, now);
  const sincePrev = previousMeetingAtWindowStart(days, now);
  return {
    currentWindow: meetings.filter((m) => m.meetingAt >= sinceCurrent),
    previousWindow: meetings.filter(
      (m) => m.meetingAt >= sincePrev && m.meetingAt < sinceCurrent,
    ),
  };
}
