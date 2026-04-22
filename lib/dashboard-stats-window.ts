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

export function meetingAtSinceForStatsWindow(
  days: StatsWindowDays,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
