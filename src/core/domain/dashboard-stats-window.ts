export const STATS_WINDOW_DAYS_OPTIONS = [7, 30, 90] as const;

export type StatsWindowDays = (typeof STATS_WINDOW_DAYS_OPTIONS)[number];

export function parseStatsWindowDays(
  raw: string | string[] | undefined,
): StatsWindowDays {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "7" || v === "90") {
    return Number(v) as StatsWindowDays;
  }
  return 30;
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
