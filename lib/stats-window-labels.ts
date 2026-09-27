import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import {
  statsRangeLabel,
  type StatsRangeInput,
} from "@/src/core/domain/stats-range";

/**
 * « 30 derniers jours », ou « du 1er août au 31 août 2026 » quand la période
 * a été choisie au calendrier : la période telle qu'on la nomme dans une phrase.
 */
export function statsWindowLabel(
  days: StatsWindowDays,
  range?: StatsRangeInput | null,
): string {
  return range ? statsRangeLabel(range) : `${days} derniers jours`;
}

/** « 30 jours précédents » : la période de comparaison, de même longueur. */
export function previousWindowLabel(
  days: StatsWindowDays,
  range?: StatsRangeInput | null,
): string {
  return range
    ? `${days} ${days > 1 ? "jours" : "jour"} qui précèdent`
    : `${days} jours précédents`;
}

/** « Podium du mois » : le nom que le podium prend selon la période. */
export function podiumLabel(days: StatsWindowDays): string {
  if (days <= 7) return "de la semaine";
  if (days <= 31) return "du mois";
  if (days <= 92) return "du trimestre";
  return "de la période";
}
