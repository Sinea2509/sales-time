import {
  STATS_WINDOW_COOKIE_NAME,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";

/** Un an : la période choisie reste mémorisée d'une visite à l'autre. */
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/**
 * Mémorise la période choisie dans le navigateur, pour toutes les pages du
 * manager. Sans cookie disponible, l'adresse suffit pour la page courante.
 */
export function rememberStatsWindow(days: StatsWindowDays): void {
  try {
    document.cookie = `${STATS_WINDOW_COOKIE_NAME}=${days}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;
  } catch {
    // Cookies bloqués : rien à faire, la période reste dans l'adresse.
  }
}
