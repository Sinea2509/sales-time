/**
 * La répartition de la parole, lue dans un transcript où chaque réplique
 * commence par le nom de celui qui parle : « Commercial : … », « Prospect :
 * … », des prénoms, ou le format des outils de visioconférence, où le nom
 * est suivi d'une heure sur sa propre ligne.
 *
 * Elle ne se calcule que si le transcript distingue vraiment les
 * intervenants : un texte d'un seul bloc n'a rien à en dire, et une
 * répartition inventée serait pire qu'une case vide. Le temps de parole est
 * approché par le nombre de mots, faute d'horodatage fiable.
 *
 * Les horodatages ne sont pas des intervenants. Un export de réunion écrit
 * « 16 septembre 2026, 09:14 » en tête et « Perrine Durand 7:32 » avant
 * chaque réplique : lus naïvement, ces deux-points fabriquaient un
 * intervenant « 16 septembre 2026, 09 » et un autre « Perrine Durand 7 », et
 * la carte annonçait 3 % contre 97 % entre une date et une personne.
 */
export type TalkShare = {
  commercialLabel: string;
  prospectLabel: string;
  /** Part du commercial sur le temps où quelqu'un parle, en pourcentage entier. */
  commercialPct: number;
  prospectPct: number;
  /** La plus longue suite de répliques du commercial sans interruption, en mots. */
  longestCommercialRunWords: number;
  /**
   * Vrai quand les rôles ont été reconnus à leur nom (« Commercial »,
   * « Client », le nom du commercial du rendez-vous) ; faux quand ils ont été
   * devinés d'après l'ordre de parole.
   */
  rolesRecognized: boolean;
};

export type TalkShareNames = {
  /** Le commercial du rendez-vous, tel que la base le nomme. */
  sellerName?: string | null;
  /** Le prospect du rendez-vous. */
  prospectName?: string | null;
};

/** Plafond conseillé pour la part du commercial : une limite, pas un objectif. */
export const TALK_SHARE_CEILING_PCT = 50;

const TIME = String.raw`\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?`;
/** Une heure seule, un repère de sous-titres (« 00:01:02 --> 00:01:05 ») ou un numéro de cue. */
const TIME_ONLY_LINE = new RegExp(
  String.raw`^\s*[\[(]?${TIME}[\])]?\s*(?:-->\s*${TIME}\s*)?$|^\s*\d+\s*$`,
);
/** « 16 septembre 2026, 09:14 » ou « 16/09/2026 09:14 » : une date, pas une personne. */
const DATE_LINE = new RegExp(
  String.raw`^\s*\d{1,2}(?:\s+[\p{L}.]+\s+|[/.-]\d{1,2}[/.-])\d{2,4}(?:,?\s*(?:à\s*)?${TIME})?\s*$`,
  "u",
);
/** « Perrine Durand 7:32 » : le nom puis l'heure, la réplique suit sur la ligne d'après. */
const SPEAKER_THEN_TIME_LINE = new RegExp(
  String.raw`^\s*([\p{L}][^:\n]{0,50}?)\s+[\[(]?${TIME}[\])]?\s*$`,
  "u",
);
/** « [09:14] Commercial : … », « Commercial (09:14) : … », « Commercial 7:32 : … », « Commercial : … ». */
const SPEAKER_LINE = new RegExp(
  String.raw`^\s*(?:[\[(]?${TIME}[\])]?\s*[-–]?\s*)?([\p{L}][^:\n]{0,40}?)\s*(?:[\[(]?${TIME}[\])]?)?\s*:\s*(.*)$`,
  "u",
);
const COMMERCIAL_LABEL =
  /(commercial|vendeur|vendeuse|seller|sales|intervenant\s*1|speaker\s*1|moi)\b/i;
const PROSPECT_LABEL =
  /(prospect|client|acheteur|acheteuse|buyer|intervenant\s*2|speaker\s*2)\b/i;
const MIN_ATTRIBUTED_SHARE = 0.8;
const MAX_LABEL_WORDS = 4;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Un libellé d'intervenant plausible : des lettres, peu de mots, pas une phrase. */
function isPlausibleLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!/\p{L}/u.test(trimmed)) return false;
  if (/\d{1,2}:\d{2}/.test(trimmed)) return false;
  return countWords(trimmed) <= MAX_LABEL_WORDS;
}

type ParsedLine =
  | { kind: "skip" }
  | { kind: "speaker"; label: string; text: string }
  | { kind: "text" };

function parseLine(line: string): ParsedLine {
  if (countWords(line) === 0) return { kind: "skip" };
  if (TIME_ONLY_LINE.test(line) || DATE_LINE.test(line))
    return { kind: "skip" };

  const speakerThenTime = SPEAKER_THEN_TIME_LINE.exec(line);
  if (speakerThenTime && isPlausibleLabel(speakerThenTime[1])) {
    return { kind: "speaker", label: speakerThenTime[1].trim(), text: "" };
  }

  const speaker = SPEAKER_LINE.exec(line);
  if (speaker && isPlausibleLabel(speaker[1])) {
    return { kind: "speaker", label: speaker[1].trim(), text: speaker[2] };
  }
  return { kind: "text" };
}

/**
 * Vrai quand un libellé d'intervenant désigne cette personne : un de ses
 * noms d'au moins trois lettres s'y retrouve, accents et casse ignorés.
 */
function labelNamesPerson(
  label: string,
  personName: string | null | undefined,
): boolean {
  if (!personName) return false;
  const tokens = normalize(personName)
    .split(/[\s,]+/)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  const normalizedLabel = normalize(label);
  return tokens.some((t) => normalizedLabel.includes(t));
}

export function talkShareFromTranscript(
  transcript: string,
  names: TalkShareNames = {},
): TalkShare | null {
  const lines = transcript.split(/\r?\n/);
  const wordsBySpeaker = new Map<string, number>();
  const labelBySpeaker = new Map<string, string>();
  const runs: Array<{ speaker: string; words: number }> = [];
  let attributedWords = 0;
  let totalWords = 0;

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed.kind === "skip") continue;

    if (parsed.kind === "text") {
      /*
        Une ligne sans intervenant prolonge la réplique précédente : un
        transcript coupe souvent une prise de parole en plusieurs lignes, et
        les exports de visioconférence mettent toujours la réplique sous le nom.
      */
      const words = countWords(line);
      totalWords += words;
      const last = runs[runs.length - 1];
      if (last) {
        last.words += words;
        wordsBySpeaker.set(
          last.speaker,
          (wordsBySpeaker.get(last.speaker) ?? 0) + words,
        );
        attributedWords += words;
      }
      continue;
    }

    /*
      Le nom de l'intervenant n'est pas une parole : « Commercial : » ne
      compte ni pour lui, ni dans le total.
    */
    const speaker = parsed.label.toLowerCase();
    const spoken = countWords(parsed.text);
    totalWords += spoken;
    if (!labelBySpeaker.has(speaker)) labelBySpeaker.set(speaker, parsed.label);
    wordsBySpeaker.set(speaker, (wordsBySpeaker.get(speaker) ?? 0) + spoken);
    attributedWords += spoken;
    const last = runs[runs.length - 1];
    if (last && last.speaker === speaker) last.words += spoken;
    else runs.push({ speaker, words: spoken });
  }

  if (totalWords === 0 || attributedWords / totalWords < MIN_ATTRIBUTED_SHARE) {
    return null;
  }
  const speakers = [...wordsBySpeaker.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);
  if (speakers.length < 2) return null;

  const labelOf = (key: string) => labelBySpeaker.get(key) ?? key;
  const byRole = (pattern: RegExp) =>
    speakers.find(([key]) => pattern.test(labelOf(key)));
  const byName = (personName: string | null | undefined) =>
    speakers.find(([key]) => labelNamesPerson(labelOf(key), personName));

  /*
    Trois façons de reconnaître un rôle, de la plus sûre à la moins sûre : le
    mot du rôle dans le libellé, le nom de la personne que la base connaît,
    et enfin l'ordre de parole, où le premier à parler est tenu pour le
    commercial parce que c'est lui qui ouvre un rendez-vous de vente.
  */
  const recognizedCommercial =
    byRole(COMMERCIAL_LABEL) ?? byName(names.sellerName);
  const recognizedProspect =
    byRole(PROSPECT_LABEL) ?? byName(names.prospectName);
  const rolesRecognized = Boolean(recognizedCommercial || recognizedProspect);

  let commercial: [string, number];
  let prospect: [string, number];
  if (
    recognizedCommercial &&
    recognizedProspect &&
    recognizedCommercial[0] !== recognizedProspect[0]
  ) {
    commercial = recognizedCommercial;
    prospect = recognizedProspect;
  } else if (recognizedCommercial) {
    commercial = recognizedCommercial;
    prospect =
      speakers.find(([k]) => k !== recognizedCommercial[0]) ?? speakers[1];
  } else if (recognizedProspect) {
    prospect = recognizedProspect;
    commercial =
      speakers.find(([k]) => k !== recognizedProspect[0]) ?? speakers[0];
  } else {
    const first = runs[0]?.speaker;
    commercial = speakers.find(([k]) => k === first) ?? speakers[0];
    prospect = speakers.find(([k]) => k !== commercial[0]) ?? speakers[1];
  }

  const spokenTotal = commercial[1] + prospect[1];
  if (spokenTotal === 0) return null;
  const commercialPct = Math.round((100 * commercial[1]) / spokenTotal);
  const longest = runs
    .filter((r) => r.speaker === commercial[0])
    .reduce((max, r) => Math.max(max, r.words), 0);

  return {
    commercialLabel: labelOf(commercial[0]),
    prospectLabel: labelOf(prospect[0]),
    commercialPct,
    prospectPct: 100 - commercialPct,
    longestCommercialRunWords: longest,
    rolesRecognized,
  };
}
