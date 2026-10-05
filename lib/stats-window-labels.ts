import type {
  StatsWindowDays,
  StatsWindowRange,
} from "@/src/core/domain/dashboard-stats-window";

const dayAndMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function calendarDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** « 1er juil. » : le premier du mois s'écrit en ordinal, comme on le dit. */
function withOrdinal(text: string): string {
  return text.replace(/^1 /, "1er ");
}

/**
 * « du 1er juil. au 30 sept. 2026 » : les deux dates d'une période choisie au
 * calendrier. L'année ne s'écrit qu'une fois quand les deux dates la partagent.
 */
export function statsWindowRangeLabel(range: StatsWindowRange): string {
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  const from = withOrdinal(
    (sameYear ? dayAndMonth : dayMonthYear).format(calendarDate(range.from)),
  );
  const to = withOrdinal(dayMonthYear.format(calendarDate(range.to)));
  return `du ${from} au ${to}`;
}

/** « 30 jours », « 12 mois » : la période telle que le sélecteur la nomme. */
export function statsWindowShortLabel(days: StatsWindowDays): string {
  return days === 365 ? "12 mois" : `${days} jours`;
}

/**
 * « 30 derniers jours » : la période telle qu'on la nomme dans une phrase
 * (« l'activité des … », « sur les … »). Une période choisie au calendrier se
 * dit « 92 jours du 1er juil. au 30 sept. 2026 ».
 */
export function statsWindowLabel(
  days: StatsWindowDays,
  range: StatsWindowRange | null = null,
): string {
  if (range) return `${days} jours ${statsWindowRangeLabel(range)}`;
  return days === 365 ? "12 derniers mois" : `${days} derniers jours`;
}

/** « 30 jours précédents » : la période de comparaison. */
export function previousWindowLabel(
  days: StatsWindowDays,
  range: StatsWindowRange | null = null,
): string {
  if (range) return `${days} jours précédents`;
  return days === 365 ? "12 mois précédents" : `${days} jours précédents`;
}

/** « Podium du mois » : le nom que le podium prend selon la période. */
export function podiumLabel(
  days: StatsWindowDays,
  range: StatsWindowRange | null = null,
): string {
  if (range) return "de la période";
  if (days <= 30) return "du mois";
  if (days <= 90) return "du trimestre";
  return "des 12 derniers mois";
}
