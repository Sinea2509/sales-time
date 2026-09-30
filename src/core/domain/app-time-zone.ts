/**
 * Le fuseau dans lequel Sales Time lit et écrit les heures.
 *
 * Un rendez-vous se saisit à l'heure du commercial, sans fuseau (un champ
 * datetime-local), et le serveur, sur Vercel, vit en temps universel. Sans
 * fuseau commun, la même heure était lue en temps universel à
 * l'enregistrement, puis relue en heure de Paris dans le formulaire : chaque
 * enregistrement ajoutait deux heures au rendez-vous. Tout passe donc par ce
 * fuseau, déclaré ici et nulle part ailleurs. Le jour où une organisation
 * vivra ailleurs, c'est ici qu'il deviendra un réglage.
 */
export const APP_TIME_ZONE = "Europe/Paris";

const WALL_CLOCK =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

function wallClockParts(
  instant: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

/** L'avance du fuseau sur le temps universel à cet instant, en millisecondes. */
function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const wholeSecond = Math.floor(instantMs / 1000) * 1000;
  const p = wallClockParts(new Date(wholeSecond), timeZone);
  const asIfUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asIfUtc - wholeSecond;
}

/**
 * Lit une heure saisie sans fuseau, « 2026-09-24T16:30 », comme une heure du
 * fuseau de l'application, et rend l'instant correspondant. Rend `null` pour
 * une chaîne qui n'a pas cette forme.
 *
 * Le décalage se calcule deux fois, pour les jours de changement d'heure :
 * une heure qui n'existe pas (le dernier dimanche de mars, entre 2 et 3
 * heures) glisse d'une heure, et une heure qui existe deux fois (fin
 * octobre) est lue à l'heure d'hiver.
 */
export function parseWallClockInAppTimeZone(
  value: string,
  timeZone: string = APP_TIME_ZONE,
): Date | null {
  const m = WALL_CLOCK.exec(value.trim());
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m
    .slice(1)
    .map((part) => Number(part ?? "0"));
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(asIfUtc)) return null;
  const firstGuess = asIfUtc - zoneOffsetMs(asIfUtc, timeZone);
  const secondOffset = zoneOffsetMs(firstGuess, timeZone);
  return new Date(asIfUtc - secondOffset);
}

/** L'heure d'un instant dans le fuseau de l'application, au format d'un champ datetime-local. */
export function toAppTimeZoneDatetimeLocal(
  date: Date,
  timeZone: string = APP_TIME_ZONE,
): string {
  const p = wallClockParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
