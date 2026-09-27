import { redirect } from "next/navigation";
import {
  parseStatsWindowDays,
  resolveEligibleStatsWindowDays,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  parseStatsRange,
  statsRangeLengthDays,
  statsRangeToInput,
  statsRangeUntil,
  type StatsRangeInput,
} from "@/src/core/domain/stats-range";
import type { StatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";

/** La requête d'une adresse, telle que Next la remet à une page. */
export type PageSearchParams = Record<string, string | string[] | undefined>;

/**
 * La période d'un écran, résolue une fois pour toute la page.
 *
 * `days` et `until` sont ce que tous les calculs prennent : une longueur et
 * une borne de fin. Pour une fenêtre glissante, la fin est maintenant ; pour
 * des dates libres, c'est le lendemain du dernier jour choisi, et `range`
 * porte les deux dates pour les libellés et le sélecteur.
 */
export type StatsPeriod = {
  days: StatsWindowDays;
  until: Date;
  range: StatsRangeInput | null;
};

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
 * Les dates libres, `du` et `au`, ne survivent pas non plus : une fenêtre
 * glissante les remplace.
 */
export function pathWithStatsWindow(
  path: string,
  searchParams: PageSearchParams,
  jours: StatsWindowDays | null,
): string {
  const q = new URLSearchParams();
  if (jours != null) q.set("jours", String(jours));
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "jours" || key === "du" || key === "au" || value == null) {
      continue;
    }
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

/**
 * La période de la page : des dates libres si l'adresse en porte de valides,
 * sinon la fenêtre glissante demandée, ramenée à une fenêtre qui a assez de
 * rendez-vous. Les dates libres ne sont pas soumises à ce seuil : qui les
 * choisit sait ce qu'il regarde.
 */
export function resolveStatsPeriod(input: {
  searchParams: PageSearchParams;
  counts: StatsWindowRdvsCounts;
  redirectPath: string;
}): StatsPeriod {
  const range = parseStatsRange(input.searchParams.du, input.searchParams.au);
  if (range) {
    return {
      days: statsRangeLengthDays(range),
      until: statsRangeUntil(range),
      range: statsRangeToInput(range),
    };
  }
  return {
    days: ensureEligibleStatsWindowDays(input),
    until: new Date(),
    range: null,
  };
}

/**
 * La même lecture, sans seuil ni redirection : pour la fiche d'un membre, qui
 * garde la période que le manager avait sous les yeux.
 */
export function statsPeriodFromSearchParams(
  searchParams: PageSearchParams,
): StatsPeriod {
  const range = parseStatsRange(searchParams.du, searchParams.au);
  if (range) {
    return {
      days: statsRangeLengthDays(range),
      until: statsRangeUntil(range),
      range: statsRangeToInput(range),
    };
  }
  return {
    days: parseStatsWindowDays(searchParams.jours),
    until: new Date(),
    range: null,
  };
}
