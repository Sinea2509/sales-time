import { redirect } from "next/navigation";
import {
  parseStatsWindowDays,
  resolveEligibleStatsWindowDays,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type { StatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";

/** La requête d'une adresse, telle que Next la remet à une page. */
export type PageSearchParams = Record<string, string | string[] | undefined>;

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
  jours: StatsWindowDays | null,
): string {
  const q = new URLSearchParams();
  if (jours != null) q.set("jours", String(jours));
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "jours" || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      q.append(key, item);
    }
  }
  const query = q.toString();
  return query === "" ? path : `${path}?${query}`;
}

/** Redirects when URL `jours` points at a window with insufficient RDV data. */
export function ensureEligibleStatsWindowDays(input: {
  searchParams: PageSearchParams;
  counts: StatsWindowRdvsCounts;
  redirectPath: string;
}): StatsWindowDays {
  const requested = parseStatsWindowDays(input.searchParams.jours);
  const resolved = resolveEligibleStatsWindowDays(requested, input.counts);
  if (resolved !== requested) {
    redirect(
      pathWithStatsWindow(input.redirectPath, input.searchParams, resolved),
    );
  }
  return resolved;
}
