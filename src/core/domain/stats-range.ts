/**
 * Une période à dates libres, choisie au calendrier : du premier jour inclus
 * au dernier jour inclus.
 *
 * Elle se convertit en fenêtre glissante pour tout le reste du produit : une
 * longueur en jours et une borne de fin, exactement ce que les calculs de
 * période prennent déjà en paramètres. Rien ne change donc dans la façon de
 * compter ; seule l'ancre bouge, d'« aujourd'hui » vers le lendemain du
 * dernier jour choisi.
 *
 * Les dates sont lues et écrites en UTC à minuit : une période choisie à
 * Paris et relue à Lyon nomme les mêmes jours, et la longueur est toujours
 * un nombre entier de jours.
 */
export type StatsRange = { from: Date; to: Date };

/** La même période, sous la forme que l'adresse et le navigateur échangent. */
export type StatsRangeInput = { from: string; to: string };

export const STATS_RANGE_MAX_DAYS = 366;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDay(raw: string | string[] | undefined): Date | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const match = ISO_DAY.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  if (Number.isNaN(date.getTime())) return null;
  /* Le 31 février se replie sur mars : on refuse ce qui ne se relit pas tel quel. */
  return formatStatsRangeDay(date) === value.trim() ? date : null;
}

/** « 2026-08-31 » pour un jour donné, en UTC. */
export function formatStatsRangeDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * La période lue dans l'adresse, ou `null` si elle ne tient pas debout : une
 * date illisible, une fin avant le début, plus d'un an, ou une fin dans le
 * futur lointain.
 */
export function parseStatsRange(
  du: string | string[] | undefined,
  au: string | string[] | undefined,
  now: Date = new Date(),
): StatsRange | null {
  const from = parseIsoDay(du);
  const to = parseIsoDay(au);
  if (!from || !to) return null;
  if (to.getTime() < from.getTime()) return null;
  if (statsRangeLengthDays({ from, to }) > STATS_RANGE_MAX_DAYS) return null;
  if (from.getTime() > now.getTime()) return null;
  return { from, to };
}

/** La borne de fin exclusive : le lendemain du dernier jour, à minuit UTC. */
export function statsRangeUntil(range: StatsRange): Date {
  return new Date(range.to.getTime() + MS_PER_DAY);
}

/** Le nombre de jours couverts, dernier jour compris. Jamais moins d'un. */
export function statsRangeLengthDays(range: StatsRange): number {
  return Math.max(
    1,
    Math.round(
      (statsRangeUntil(range).getTime() - range.from.getTime()) / MS_PER_DAY,
    ),
  );
}

export function statsRangeToInput(range: StatsRange): StatsRangeInput {
  return {
    from: formatStatsRangeDay(range.from),
    to: formatStatsRangeDay(range.to),
  };
}

const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** « du 1er août au 31 août 2026 », l'année une seule fois quand elle est la même. */
export function statsRangeLabel(range: StatsRange | StatsRangeInput): string {
  const from =
    range.from instanceof Date
      ? range.from
      : new Date(`${range.from}T00:00:00.000Z`);
  const to =
    range.to instanceof Date ? range.to : new Date(`${range.to}T00:00:00.000Z`);
  const premier = (text: string) => text.replace(/^1 /, "1er ");
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const debut = premier(
    sameYear ? dayMonth.format(from) : dayMonthYear.format(from),
  );
  const fin = premier(dayMonthYear.format(to));
  return `du ${debut} au ${fin}`;
}
