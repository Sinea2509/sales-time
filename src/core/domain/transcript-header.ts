/**
 * La date et la durée qu'une transcription de réunion écrit dans son en-tête.
 *
 * Teams commence par le titre, puis « 29 septembre 2026, 01:09PM », puis
 * « 54min 42sec ». Le formulaire s'en sert pour préremplir la date et la durée
 * du rendez-vous quand on colle le transcript, sans rien écraser de ce que le
 * commercial a déjà saisi.
 */
export type TranscriptHeaderFacts = {
  /** « 2026-09-29 », la valeur d'un champ date. */
  date: string | null;
  durationMin: number | null;
};

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/** Les premières lignes seulement : une date citée dans la conversation n'est pas celle du rendez-vous. */
const HEADER_LINES = 6;

function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR");
}

export function transcriptHeaderFacts(
  transcript: string,
): TranscriptHeaderFacts {
  const head = transcript
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, HEADER_LINES);
  let date: string | null = null;
  let durationMin: number | null = null;
  for (const raw of head) {
    const line = plain(raw);
    if (!date) {
      const fr = /(?<!\d)(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})(?!\d)/.exec(
        line,
      );
      const en = /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})(?!\d)/.exec(line);
      const iso = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/.exec(line);
      let y: number | null = null;
      let m: number | null = null;
      let d: number | null = null;
      if (fr && MONTHS[fr[2]])
        [d, m, y] = [Number(fr[1]), MONTHS[fr[2]], Number(fr[3])];
      else if (en && MONTHS[en[1]])
        [m, d, y] = [MONTHS[en[1]], Number(en[2]), Number(en[3])];
      else if (iso)
        [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
      if (y && m && d && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
        date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    if (durationMin == null) {
      const hms =
        /^(?:(\d{1,2})\s*h\s*)?(\d{1,3})\s*min(?:\s*(\d{1,2})\s*s(?:ec)?)?$/.exec(
          line,
        );
      const hoursOnly = /^(\d{1,2})\s*h(?:\s*(\d{1,2})\s*s(?:ec)?)?$/.exec(
        line,
      );
      if (hms) {
        const minutes =
          Number(hms[1] ?? 0) * 60 +
          Number(hms[2]) +
          (Number(hms[3] ?? 0) >= 30 ? 1 : 0);
        if (minutes > 0) durationMin = minutes;
      } else if (hoursOnly) {
        durationMin = Number(hoursOnly[1]) * 60;
      }
    }
  }
  return { date, durationMin };
}

/**
 * Lit la valeur d'un champ date (« 2026-09-29 ») comme une heure de midi.
 *
 * La date du rendez-vous se saisit sans heure. Midi, plutôt que minuit,
 * garde le bon jour quel que soit le fuseau qui la relit.
 */
export function dateOnlyToWallClock(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}T12:00` : null;
}
