import { cookies } from "next/headers";
import {
  parseStatsWindowCookie,
  parseStatsWindowDays,
  parseStatsWindowRange,
  STATS_WINDOW_COOKIE_NAME,
  statsWindowFromRange,
  type StatsWindow,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { setStatsWindowParams } from "@/lib/stats-window-params";
import type { StatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";

/** La requête d'une adresse, telle que Next la remet à une page. */
export type PageSearchParams = Record<string, string | string[] | undefined>;

/** Les paramètres d'adresse qui nomment une période. */
const PERIOD_PARAMS = new Set(["jours", "du", "au"]);

/**
 * Une adresse qui garde la requête reçue, la période remplacée.
 *
 * `jours` n'est pas le seul paramètre de ces pages : la liste d'équipe y écrit
 * aussi son numéro de page. Une adresse rebâtie autour du seul `jours` renvoie
 * donc le lecteur à la première page sans le lui dire, pour la seule raison que
 * la période demandée n'était pas disponible.
 *
 * Une période à `null` retire le paramètre au lieu de l'écrire : c'est ce que
 * fait la fiche d'un membre, dont la période par défaut se dit par son absence.
 */
export function pathWithStatsWindow(
  path: string,
  searchParams: PageSearchParams,
  period: StatsWindow | StatsWindowDays | null,
): string {
  const q = new URLSearchParams();
  if (period != null) setStatsWindowParams(q, period);
  for (const [key, value] of Object.entries(searchParams)) {
    if (PERIOD_PARAMS.has(key) || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      q.append(key, item);
    }
  }
  const query = q.toString();
  return query === "" ? path : `${path}?${query}`;
}

/**
 * La période demandée : celle de l'adresse (`?du=…&au=…` choisie au
 * calendrier, ou `?jours=`), sinon celle que le manager a choisie en dernier
 * sur une autre page (cookie), sinon 30 jours.
 */
export async function requestedStatsWindow(
  searchParams: PageSearchParams,
): Promise<StatsWindow> {
  const range = parseStatsWindowRange(searchParams.du, searchParams.au);
  if (range) return statsWindowFromRange(range);
  if (searchParams.jours != null) {
    return { days: parseStatsWindowDays(searchParams.jours), range: null };
  }
  const fromCookie = (await cookies()).get(STATS_WINDOW_COOKIE_NAME)?.value;
  return parseStatsWindowCookie(fromCookie);
}

/**
 * La période affichée par une page de statistiques.
 *
 * Comme la maquette du 11 septembre, toute période se choisit, même quand
 * elle compte peu de rendez-vous : le sélecteur le signale (« peu de
 * données ») au lieu de griser l'option ou de renvoyer ailleurs. Les comptes
 * restent passés, pour les pages qui les affichent.
 */
export async function ensureEligibleStatsWindow(input: {
  searchParams: PageSearchParams;
  counts: StatsWindowRdvsCounts;
  redirectPath: string;
}): Promise<StatsWindow> {
  return requestedStatsWindow(input.searchParams);
}
