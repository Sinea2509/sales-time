import { parseWallClockInAppTimeZone } from "./app-time-zone";

/**
 * Les périodes de la maquette du 11 septembre : 30 jours, 90 jours, 12 mois.
 * Douze mois s'écrivent 365 jours : toutes les fenêtres se comptent en jours.
 */
export const STATS_WINDOW_DAYS_OPTIONS = [30, 90, 365] as const;

/** Une des trois périodes prêtes à l'emploi du sélecteur. */
export type StatsWindowPreset = (typeof STATS_WINDOW_DAYS_OPTIONS)[number];

/**
 * La durée d'une période, en jours. Une période choisie au calendrier en a
 * autant que de jours entre ses deux dates, bornes comprises.
 */
export type StatsWindowDays = number;

/**
 * Une période choisie au calendrier : du `from` au `to`, deux dates du
 * calendrier (« 2026-07-01 »), bornes comprises, lues dans le fuseau de
 * l'application.
 */
export type StatsWindowRange = { from: string; to: string };

/**
 * La période d'une page de statistiques : une durée, et, quand elle a été
 * choisie au calendrier, ses deux dates. Sans dates, la période se termine
 * maintenant (« 30 derniers jours »).
 */
export type StatsWindow = {
  days: StatsWindowDays;
  range: StatsWindowRange | null;
};

/**
 * La fenêtre retenue quand l'adresse n'en nomme aucune.
 *
 * Elle est nommée plutôt qu'écrite en chiffre à chaque emploi, parce que
 * plusieurs endroits ont besoin de savoir laquelle est implicite : les liens
 * qui l'omettent volontairement de l'adresse, et la page qui retire ce
 * paramètre quand il ne dit rien de plus que le défaut.
 */
export const DEFAULT_STATS_WINDOW_DAYS: StatsWindowPreset = 30;

/** Seuil minimal de RDV pour afficher tendances KPI et activer une fenêtre stats. */
export const MIN_RDV_FOR_STATS = 5;

export function isStatsWindowEligibleForTrends(nbRdvs: number): boolean {
  return nbRdvs >= MIN_RDV_FOR_STATS;
}

export function disabledStatsWindowDays(
  counts: Record<StatsWindowPreset, number>,
): StatsWindowPreset[] {
  return STATS_WINDOW_DAYS_OPTIONS.filter(
    (d) => !isStatsWindowEligibleForTrends(counts[d]),
  );
}

/**
 * Aucune fenêtre n'atteint le seuil : le sélecteur de période n'a plus rien à
 * proposer, et un écran qui invite à changer de période propose l'impossible.
 *
 * Le calcul passe par un ensemble plutôt que par une comparaison de longueurs :
 * une liste qui contiendrait deux fois la même fenêtre répondrait autrement.
 */
export function areAllStatsWindowsDisabled(
  disabledDays: readonly StatsWindowPreset[],
): boolean {
  const disabled = new Set(disabledDays);
  return STATS_WINDOW_DAYS_OPTIONS.every((d) => disabled.has(d));
}

/** Choisit la première fenêtre éligible (30 → 90 → 12 mois) si la demande est insuffisante. */
export function resolveEligibleStatsWindowDays(
  requested: StatsWindowPreset,
  counts: Record<StatsWindowPreset, number>,
): StatsWindowPreset {
  if (isStatsWindowEligibleForTrends(counts[requested])) return requested;
  for (const d of STATS_WINDOW_DAYS_OPTIONS) {
    if (isStatsWindowEligibleForTrends(counts[d])) return d;
  }
  return requested;
}

export function parseStatsWindowDays(
  raw: string | string[] | undefined,
): StatsWindowPreset {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = v != null ? String(v) : "";
  if (s === "30" || s === "90" || s === "365") {
    return Number(s) as StatsWindowPreset;
  }
  return DEFAULT_STATS_WINDOW_DAYS;
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

/**
 * Split meetings into current stats window vs the immediately preceding window.
 * Une période choisie au calendrier s'arrête à sa date de fin : les rendez-vous
 * d'après n'y entrent pas.
 */
export function partitionMeetingsByStatsWindow<T extends { meetingAt: Date }>(
  meetings: T[],
  days: StatsWindowDays,
  now: Date = new Date(),
  range: StatsWindowRange | null = null,
): { currentWindow: T[]; previousWindow: T[] } {
  const { since, before, previousSince } = statsWindowBounds(
    { days, range },
    now,
  );
  return {
    currentWindow: meetings.filter(
      (m) => m.meetingAt >= since && (before == null || m.meetingAt < before),
    ),
    previousWindow: meetings.filter(
      (m) => m.meetingAt >= previousSince && m.meetingAt < since,
    ),
  };
}

/**
 * Les bornes d'une période, en instants.
 *
 * - `since` : son début, compris ;
 * - `before` : sa fin, exclue, ou `null` pour une période qui court jusqu'à
 *   maintenant ;
 * - `previousSince` : le début de la période de comparaison, de même durée,
 *   qui la précède immédiatement et s'arrête à `since`.
 */
export function statsWindowBounds(
  window: StatsWindow,
  now: Date = new Date(),
): { since: Date; before: Date | null; previousSince: Date } {
  if (window.range) {
    const since = startOfCalendarDay(window.range.from);
    const before = startOfCalendarDay(addCalendarDays(window.range.to, 1));
    return {
      since,
      before,
      previousSince: new Date(
        since.getTime() - (before.getTime() - since.getTime()),
      ),
    };
  }
  return {
    since: meetingAtSinceForStatsWindow(window.days, now),
    before: null,
    previousSince: previousMeetingAtWindowStart(window.days, now),
  };
}

/** Une période de calendrier ne dépasse pas trois ans : au-delà, la page ne charge plus rien d'utile. */
export const STATS_WINDOW_RANGE_MAX_DAYS = 3 * 366;

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarDateUtc(value: string): number | null {
  const m = CALENDAR_DATE.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = Date.UTC(y, mo - 1, d);
  const back = new Date(utc);
  // « 2026-02-31 » n'existe pas : Date.UTC le pousserait au 3 mars.
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1) return null;
  if (back.getUTCDate() !== d) return null;
  return utc;
}

function addCalendarDays(value: string, days: number): string {
  const utc = calendarDateUtc(value);
  if (utc == null) return value;
  return new Date(utc + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function startOfCalendarDay(value: string): Date {
  return (
    parseWallClockInAppTimeZone(`${value}T00:00`) ??
    new Date(calendarDateUtc(value) ?? 0)
  );
}

/** Le nombre de jours d'une période de calendrier, ses deux dates comprises. */
export function statsWindowRangeDays(range: StatsWindowRange): number {
  const from = calendarDateUtc(range.from);
  const to = calendarDateUtc(range.to);
  if (from == null || to == null) return 0;
  return Math.round((to - from) / MS_PER_DAY) + 1;
}

/**
 * Lit deux dates saisies au calendrier. Rend `null` quand l'une manque ou
 * n'existe pas, ou quand la période dépasse trois ans. Deux dates données à
 * l'envers sont remises dans l'ordre plutôt que refusées.
 */
export function parseStatsWindowRange(
  fromRaw: string | string[] | undefined,
  toRaw: string | string[] | undefined,
): StatsWindowRange | null {
  const first = (raw: string | string[] | undefined) =>
    String((Array.isArray(raw) ? raw[0] : raw) ?? "").trim();
  let from = first(fromRaw);
  let to = first(toRaw);
  if (calendarDateUtc(from) == null || calendarDateUtc(to) == null) return null;
  if (from > to) [from, to] = [to, from];
  const range = { from, to };
  return statsWindowRangeDays(range) > STATS_WINDOW_RANGE_MAX_DAYS
    ? null
    : range;
}

/** Une période de calendrier, avec sa durée. */
export function statsWindowFromRange(range: StatsWindowRange): StatsWindow {
  return { days: statsWindowRangeDays(range), range };
}

/**
 * La période telle que le cookie la garde : « 90 » pour une période prête à
 * l'emploi, « 2026-07-01_2026-09-30 » pour une période de calendrier.
 */
export function statsWindowCookieValue(window: StatsWindow): string {
  return window.range
    ? `${window.range.from}_${window.range.to}`
    : String(window.days);
}

/** Relit la valeur du cookie ; une valeur illisible rend la période par défaut. */
export function parseStatsWindowCookie(raw: string | undefined): StatsWindow {
  const [from, to] = (raw ?? "").split("_");
  const range = to != null ? parseStatsWindowRange(from, to) : null;
  if (range) return statsWindowFromRange(range);
  return { days: parseStatsWindowDays(raw), range: null };
}

/**
 * Le cookie qui garde la période choisie d'une page à l'autre : la maquette
 * dit « La période choisie s'applique à toutes les pages du manager ».
 * L'adresse (`?jours=`) l'emporte quand elle en nomme une.
 */
export const STATS_WINDOW_COOKIE_NAME = "st_periode";
