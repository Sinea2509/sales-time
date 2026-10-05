import type {
  StatsWindow,
  StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";

/**
 * Écrit une période dans une requête : `jours=90` pour une période prête à
 * l'emploi, `du=2026-07-01&au=2026-09-30` pour une période de calendrier.
 */
export function setStatsWindowParams(
  q: URLSearchParams,
  period: StatsWindow | StatsWindowDays,
): void {
  const window: StatsWindow =
    typeof period === "number" ? { days: period, range: null } : period;
  if (window.range) {
    q.set("du", window.range.from);
    q.set("au", window.range.to);
  } else {
    q.set("jours", String(window.days));
  }
}
