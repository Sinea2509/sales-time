import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

/** « 30 jours », « 12 mois » : la période telle que le sélecteur la nomme. */
export function statsWindowShortLabel(days: StatsWindowDays): string {
  return days === 365 ? "12 mois" : `${days} jours`;
}

/** « 30 derniers jours » : la période telle qu'on la nomme dans une phrase. */
export function statsWindowLabel(days: StatsWindowDays): string {
  return days === 365 ? "12 derniers mois" : `${days} derniers jours`;
}

/** « 30 jours précédents » : la période de comparaison. */
export function previousWindowLabel(days: StatsWindowDays): string {
  return days === 365 ? "12 mois précédents" : `${days} jours précédents`;
}

/** « Podium du mois » : le nom que le podium prend selon la période. */
export function podiumLabel(days: StatsWindowDays): string {
  if (days <= 30) return "du mois";
  if (days <= 90) return "du trimestre";
  return "des 12 derniers mois";
}
