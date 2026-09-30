import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

/** « 30 derniers jours » : la période telle qu'on la nomme dans une phrase. */
export function statsWindowLabel(days: StatsWindowDays): string {
  return `${days} derniers jours`;
}

/** « 30 jours précédents » : la période de comparaison. */
export function previousWindowLabel(days: StatsWindowDays): string {
  return `${days} jours précédents`;
}

/** « Podium du mois » : le nom que le podium prend selon la période. */
export function podiumLabel(days: StatsWindowDays): string {
  if (days <= 7) return "de la semaine";
  if (days <= 30) return "du mois";
  return "du trimestre";
}
