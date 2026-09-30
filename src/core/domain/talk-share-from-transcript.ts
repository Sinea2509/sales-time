/**
 * La répartition de la parole, lue dans un transcript où chaque réplique
 * commence par le nom de celui qui parle : « Commercial : … », « Prospect :
 * … », ou des prénoms.
 *
 * Elle ne se calcule que si le transcript distingue vraiment les
 * intervenants : un texte d'un seul bloc n'a rien à en dire, et une
 * répartition inventée serait pire qu'une case vide. Le temps de parole est
 * approché par le nombre de mots, faute d'horodatage.
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
   * « Client »…) ; faux quand ils ont été devinés d'après l'ordre de parole.
   */
  rolesRecognized: boolean;
};

/** Plafond conseillé pour la part du commercial : une limite, pas un objectif. */
export const TALK_SHARE_CEILING_PCT = 50;

const SPEAKER_LINE = /^\s*([^:\n]{1,40}?)\s*:\s*(.*)$/;
const COMMERCIAL_LABEL =
  /(commercial|vendeur|vendeuse|seller|sales|intervenant\s*1|speaker\s*1|moi)\b/i;
const PROSPECT_LABEL =
  /(prospect|client|acheteur|acheteuse|buyer|intervenant\s*2|speaker\s*2)\b/i;
const MIN_ATTRIBUTED_SHARE = 0.8;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function talkShareFromTranscript(transcript: string): TalkShare | null {
  const lines = transcript.split(/\r?\n/);
  const wordsBySpeaker = new Map<string, number>();
  const labelBySpeaker = new Map<string, string>();
  const runs: Array<{ speaker: string; words: number }> = [];
  let attributedWords = 0;
  let totalWords = 0;

  for (const line of lines) {
    const words = countWords(line);
    if (words === 0) continue;
    const match = SPEAKER_LINE.exec(line);
    /*
      Le nom de l'intervenant n'est pas une parole : « Commercial : » ne
      compte ni pour lui, ni dans le total.
    */
    totalWords += match ? countWords(match[2]) : words;
    if (!match) {
      /*
        Une ligne sans intervenant prolonge la réplique précédente : un
        transcript coupe souvent une prise de parole en plusieurs lignes.
      */
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
    const speaker = match[1].trim().toLowerCase();
    const spoken = countWords(match[2]);
    if (!labelBySpeaker.has(speaker))
      labelBySpeaker.set(speaker, match[1].trim());
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

  const byRole = (pattern: RegExp) =>
    speakers.find(([key]) => pattern.test(labelBySpeaker.get(key) ?? key));
  const recognizedCommercial = byRole(COMMERCIAL_LABEL);
  const recognizedProspect = byRole(PROSPECT_LABEL);
  const rolesRecognized = Boolean(recognizedCommercial || recognizedProspect);

  let commercial: [string, number];
  let prospect: [string, number];
  if (recognizedCommercial && recognizedProspect) {
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
    /*
      Sans nom de rôle, le premier à parler est tenu pour le commercial :
      c'est lui qui ouvre un rendez-vous de vente, presque toujours.
    */
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
    commercialLabel: labelBySpeaker.get(commercial[0]) ?? commercial[0],
    prospectLabel: labelBySpeaker.get(prospect[0]) ?? prospect[0],
    commercialPct,
    prospectPct: 100 - commercialPct,
    longestCommercialRunWords: longest,
    rolesRecognized,
  };
}
