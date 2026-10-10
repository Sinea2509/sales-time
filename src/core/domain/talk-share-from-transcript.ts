/**
 * La répartition de la parole, lue dans un transcript qui nomme ses
 * intervenants.
 *
 * Trois écritures sont reconnues :
 * - « Commercial : … » ou « Julien : … », le nom puis deux-points ;
 * - celle de Teams, Zoom ou Meet : « Lisa ANDROLUS   0:03 » seul sur sa
 *   ligne, la réplique sur les lignes suivantes ;
 * - un horodatage devant ou après le nom : « [00:03] Julien : … »,
 *   « Julien (00:03) : … ».
 *
 * Le temps de parole est approché par le nombre de mots. Le transcript doit
 * vraiment distinguer ses intervenants : un texte d'un seul bloc n'a rien à en
 * dire, et une répartition inventée serait pire qu'une case vide.
 */
export type TalkShare = {
  commercialLabel: string;
  /** L'intervenant principal côté client, suivi de « et N autres » s'il y en a. */
  prospectLabel: string;
  /** Part du commercial sur le temps où quelqu'un parle, en pourcentage entier. */
  commercialPct: number;
  prospectPct: number;
  /** La plus longue suite de répliques du commercial sans interruption, en mots. */
  longestCommercialRunWords: number;
  /**
   * Vrai quand le commercial a été reconnu sûrement (rôle écrit, nom connu,
   * organisateur de la réunion) ; faux quand il a été deviné.
   */
  rolesRecognized: boolean;
  /** Comment le commercial a été reconnu, pour le dire au lecteur. */
  rolesBasis: "labels" | "names" | "organizer" | "questions" | "order";
};

/** Plafond conseillé pour la part du commercial : une limite, pas un objectif. */
export const TALK_SHARE_CEILING_PCT = 50;

/** Ce que le produit sait déjà du rendez-vous, pour reconnaître les intervenants. */
export type TalkShareHints = {
  /** Le nom du commercial du rendez-vous, s'il est connu. */
  sellerName?: string | null;
  /** Les noms connus côté client (le contact du rendez-vous). */
  prospectNames?: readonly (string | null | undefined)[];
};

const TIMESTAMP = String.raw`\d{1,2}:\d{2}(?::\d{2})?`;
/** « Lisa ANDROLUS   0:03 » : le nom puis l'horodatage, rien d'autre (Teams, Zoom, Meet). */
const NAME_THEN_TIMESTAMP = new RegExp(`^\\s*(.{1,60}?)\\s+${TIMESTAMP}\\s*$`);
/** Un horodatage en tête de ligne : « [00:03] », « 00:03 - ». */
const LEADING_TIMESTAMP = new RegExp(
  `^\\s*[\\[(]?${TIMESTAMP}[\\])]?\\s*[-–]?\\s*`,
);
/** « Julien (00:03) : … » ou « Julien [00:03] : … ». */
const NAME_TIMESTAMP_COLON = new RegExp(
  `^\\s*(.{1,60}?)\\s*[\\[(]${TIMESTAMP}[\\])]\\s*:\\s*(.*)$`,
);
/** « Julien : … ». */
const NAME_COLON = /^\s*([^:\n]{1,40}?)\s*:\s*(.*)$/;
/** « Cédric Laigneau a commencé la transcription » (Teams) : l'organisateur. */
const TRANSCRIPTION_STARTER =
  /^\s*(.{1,60}?)\s+a (?:commencé|démarré) (?:la )?(?:transcription|l'enregistrement)/im;

const COMMERCIAL_LABEL =
  /(commercial|commerciale|vendeur|vendeuse|seller|sales|intervenant\s*1|speaker\s*1|moi)\b/i;
const PROSPECT_LABEL =
  /(prospect|client|cliente|acheteur|acheteuse|buyer|intervenant\s*2|speaker\s*2)\b/i;

/** Des mots suivis de deux-points qui ne sont jamais un intervenant. */
const NOT_A_SPEAKER = new Set([
  "participants",
  "participant",
  "transcript",
  "transcription",
  "date",
  "durée",
  "objet",
  "note",
  "notes",
  "remarque",
  "exemple",
  "attention",
  "contexte",
  "sujet",
  "résumé",
  "rappel",
  "important",
  "ordre du jour",
  "compte rendu",
  "compte-rendu",
]);

const MIN_ATTRIBUTED_SHARE = 0.8;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/\s+/g, " ")
    .trim();
}

/** Un nom d'intervenant plausible : pas de chiffre, cinq mots au plus, commence par une lettre. */
function isSpeakerLabel(label: string): boolean {
  const l = label.trim();
  if (!l || l.length > 40) return false;
  if (/\d/.test(l)) return false;
  if (!/^\p{L}/u.test(l)) return false;
  if (countWords(l) > 5) return false;
  return !NOT_A_SPEAKER.has(normalize(l));
}

type SpeakerLine = { label: string; spoken: string };

/** Lit une ligne comme une prise de parole, ou rien. */
function readSpeakerLine(line: string): SpeakerLine | null {
  const teams = NAME_THEN_TIMESTAMP.exec(line);
  if (teams && isSpeakerLabel(teams[1])) {
    return { label: teams[1].trim(), spoken: "" };
  }
  const withTimestamp = NAME_TIMESTAMP_COLON.exec(line);
  if (withTimestamp && isSpeakerLabel(withTimestamp[1])) {
    return { label: withTimestamp[1].trim(), spoken: withTimestamp[2] };
  }
  const stripped = line.replace(LEADING_TIMESTAMP, "");
  const colon = NAME_COLON.exec(stripped);
  if (colon && isSpeakerLabel(colon[1])) {
    return { label: colon[1].trim(), spoken: colon[2] };
  }
  return null;
}

/** Vrai quand un nom d'intervenant désigne la même personne qu'un nom connu. */
function sameName(label: string, known: string | null | undefined): boolean {
  if (!known) return false;
  const parts = normalize(known)
    .split(/[\s,()-]+/)
    .filter((p) => p.length >= 3);
  if (parts.length === 0) return false;
  const words = new Set(normalize(label).split(/[\s,()-]+/));
  return parts.some((p) => words.has(p));
}

/** Ce que le découpage par intervenant établit, avant d'en tirer une répartition. */
type SpeakerReading = {
  share: TalkShare;
  commercialKey: string;
  textBySpeaker: ReadonlyMap<string, string>;
  turns: ReadonlyArray<{ speaker: string; words: number; text: string[] }>;
};

export function talkShareFromTranscript(
  transcript: string,
  hints: TalkShareHints = {},
): TalkShare | null {
  return readSpeakers(transcript, hints)?.share ?? null;
}

/**
 * Le transcript coupé en deux : ce qu'a dit le commercial, ce qu'a dit le
 * client. Rend `null` quand le transcript ne distingue pas ses intervenants.
 *
 * Sert à vérifier qui a dit une citation : un levier SONCAS ou une réponse du
 * prospect ne se prouvent pas avec les mots du commercial.
 */
export function transcriptSides(
  transcript: string,
  hints: TalkShareHints = {},
): { seller: string; prospect: string; rolesRecognized: boolean } | null {
  const reading = readSpeakers(transcript, hints);
  if (!reading) return null;
  const prospect: string[] = [];
  for (const [key, text] of reading.textBySpeaker) {
    if (key !== reading.commercialKey) prospect.push(text);
  }
  return {
    seller: reading.textBySpeaker.get(reading.commercialKey) ?? "",
    prospect: prospect.join("\n"),
    rolesRecognized: reading.share.rolesRecognized,
  };
}

function readSpeakers(
  transcript: string,
  hints: TalkShareHints,
): SpeakerReading | null {
  const lines = transcript.split(/\r?\n/);

  /*
    Premier passage : qui est intervenant. Un vrai intervenant prend la parole
    plusieurs fois ; « Voilà : » ou « Participants : », une seule. Quand
    personne ne parle deux fois (un échange très court), chacun compte.
  */
  const occurrences = new Map<string, number>();
  for (const line of lines) {
    const s = readSpeakerLine(line);
    if (s) {
      const key = normalize(s.label);
      occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
    }
  }
  const recurring = [...occurrences].filter(([, n]) => n >= 2).map(([k]) => k);
  const speakerKeys = new Set(
    recurring.length >= 2 ? recurring : [...occurrences.keys()],
  );

  /* Second passage : les mots de chacun, réplique par réplique. */
  const wordsBySpeaker = new Map<string, number>();
  const questionsBySpeaker = new Map<string, number>();
  const labelBySpeaker = new Map<string, string>();
  const textParts = new Map<string, string[]>();
  const turns: Array<{ speaker: string; words: number; text: string[] }> = [];
  let attributedWords = 0;
  let totalWords = 0;
  /** Les mots avant la première réplique : titre, date, durée de la réunion. */
  let preambleWords = 0;
  let current: { speaker: string; words: number; text: string[] } | null = null;

  const add = (speaker: string, text: string) => {
    const w = countWords(text);
    if (w === 0) return;
    const parts = textParts.get(speaker) ?? [];
    parts.push(text.trim());
    textParts.set(speaker, parts);
    wordsBySpeaker.set(speaker, (wordsBySpeaker.get(speaker) ?? 0) + w);
    questionsBySpeaker.set(
      speaker,
      (questionsBySpeaker.get(speaker) ?? 0) + (text.match(/\?/g)?.length ?? 0),
    );
    attributedWords += w;
    if (current) {
      current.words += w;
      current.text.push(text.trim());
    }
  };

  for (const line of lines) {
    if (countWords(line) === 0) continue;
    const s = readSpeakerLine(line);
    const key = s ? normalize(s.label) : null;
    if (s && key && speakerKeys.has(key)) {
      if (!labelBySpeaker.has(key)) labelBySpeaker.set(key, s.label);
      totalWords += countWords(s.spoken);
      if (!current || current.speaker !== key) {
        current = { speaker: key, words: 0, text: [] };
        turns.push(current);
      }
      add(key, s.spoken);
      continue;
    }
    /*
      Une ligne sans intervenant prolonge la réplique en cours : Teams écrit la
      réplique sous le nom, et tout transcript coupe une longue prise de
      parole en plusieurs lignes. Avant la première réplique (titre, date,
      durée), elle ne compte pour personne.
    */
    totalWords += countWords(line);
    if (current) add(current.speaker, line);
    else preambleWords += countWords(line);
  }

  /*
    Le préambule (titre, date, durée) ne compte pas contre le transcript ;
    il ne doit pas non plus en être l'essentiel. Et une conversation de plus
    de deux cents mots où personne ne reprend la parole n'est pas un
    dialogue : ce sont des « Voilà : » pris pour des noms.
  */
  const dialogueWords = totalWords - preambleWords;
  if (
    dialogueWords <= 0 ||
    preambleWords / totalWords >= 0.5 ||
    attributedWords / dialogueWords < MIN_ATTRIBUTED_SHARE ||
    (recurring.length < 2 && totalWords > 200)
  ) {
    return null;
  }
  const speakers = [...wordsBySpeaker.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);
  if (speakers.length < 2) return null;
  const labelOf = (key: string) => labelBySpeaker.get(key) ?? key;

  /* Qui est le commercial, du signe le plus sûr au plus fragile. */
  let commercialKey: string | null = null;
  let basis: TalkShare["rolesBasis"] = "order";
  const byRole = (pattern: RegExp) =>
    speakers.find(([key]) => pattern.test(labelOf(key)))?.[0] ?? null;
  const roleCommercial = byRole(COMMERCIAL_LABEL);
  const roleProspect = byRole(PROSPECT_LABEL);
  if (roleCommercial) {
    commercialKey = roleCommercial;
    basis = "labels";
  } else if (roleProspect) {
    commercialKey = speakers.find(([k]) => k !== roleProspect)?.[0] ?? null;
    basis = "labels";
  }
  if (!commercialKey && hints.sellerName) {
    commercialKey =
      speakers.find(([k]) => sameName(labelOf(k), hints.sellerName))?.[0] ??
      null;
    if (commercialKey) basis = "names";
  }
  if (!commercialKey && hints.prospectNames?.some(Boolean)) {
    const prospectSide = speakers.filter(([k]) =>
      hints.prospectNames!.some((n) => sameName(labelOf(k), n)),
    );
    if (prospectSide.length > 0 && prospectSide.length < speakers.length) {
      commercialKey =
        speakers.find(([k]) => !prospectSide.some(([p]) => p === k))?.[0] ??
        null;
      if (commercialKey) basis = "names";
    }
  }
  if (!commercialKey) {
    const starter = TRANSCRIPTION_STARTER.exec(transcript)?.[1];
    if (starter) {
      commercialKey =
        speakers.find(
          ([k]) => normalize(labelOf(k)) === normalize(starter),
        )?.[0] ?? null;
      if (commercialKey) basis = "organizer";
    }
  }
  if (!commercialKey) {
    /*
      En découverte, le commercial pose les questions. Il faut un écart net
      pour s'y fier ; sinon, le premier à parler, qui ouvre presque toujours
      un rendez-vous de vente.
    */
    const byQuestions = [...speakers]
      .map(([k]) => [k, questionsBySpeaker.get(k) ?? 0] as const)
      .sort((a, b) => b[1] - a[1]);
    const [top, second] = byQuestions;
    if (top && top[1] >= 3 && top[1] >= 2 * (second?.[1] ?? 0)) {
      commercialKey = top[0];
      basis = "questions";
    } else {
      commercialKey = turns[0]?.speaker ?? speakers[0][0];
      basis = "order";
    }
  }

  const commercialWords = wordsBySpeaker.get(commercialKey) ?? 0;
  const others = speakers.filter(([k]) => k !== commercialKey);
  if (others.length === 0 || attributedWords === 0) return null;
  const commercialPct = Math.round((100 * commercialWords) / attributedWords);
  const mainProspect = labelOf(others[0][0]);
  const prospectLabel =
    others.length > 1
      ? `${mainProspect} et ${others.length - 1} ${others.length - 1 > 1 ? "autres" : "autre"}`
      : mainProspect;
  const longest = turns
    .filter((t) => t.speaker === commercialKey)
    .reduce((max, t) => Math.max(max, t.words), 0);

  const textBySpeaker = new Map<string, string>();
  for (const [key, parts] of textParts)
    textBySpeaker.set(key, parts.join("\n"));

  const share: TalkShare = {
    commercialLabel: labelOf(commercialKey),
    prospectLabel,
    commercialPct,
    prospectPct: 100 - commercialPct,
    longestCommercialRunWords: longest,
    rolesRecognized:
      basis === "labels" || basis === "names" || basis === "organizer",
    rolesBasis: basis,
  };
  return { share, commercialKey, textBySpeaker, turns };
}

/** Le critère de la grille qui note l'écoute. */
export const LISTENING_CRITERION_KEY = "E1";

/**
 * Le niveau d'écoute que la part de parole du commercial autorise, de 0 à 4.
 *
 * Un premier rendez-vous réussi laisse parler le prospect : jusqu'à 40 % de
 * parole pour le commercial, niveau 4 ; jusqu'à 50 %, 3 ; jusqu'à 60 %, 2 ;
 * au-delà, 1. Le produit fixe ce niveau, le modèle n'y touche pas.
 */
export function listeningLevelFromTalkShare(commercialPct: number): number {
  if (commercialPct <= 40) return 4;
  if (commercialPct <= 50) return 3;
  if (commercialPct <= 60) return 2;
  return 1;
}

/** Ce que le produit a mesuré, écrit pour la consigne de la grille. */
export function talkShareInstruction(share: TalkShare): string {
  const level = listeningLevelFromTalkShare(share.commercialPct);
  return [
    "## Faits mesurés par le produit",
    `Dans ce transcript, le commercial (${share.commercialLabel}) a parlé ${share.commercialPct} % du temps de parole et ${share.prospectLabel} ${share.prospectPct} %, compté en mots. Sa plus longue prise de parole d'affilée fait ${share.longestCommercialRunWords} mots.`,
    `Le critère ${LISTENING_CRITERION_KEY} (écoute) est fixé par le produit au niveau ${level} sur cette mesure : 4 jusqu'à 40 % de parole pour le commercial, 3 jusqu'à 50 %, 2 jusqu'à 60 %, 1 au-delà. Ne déduis jamais la répartition de la parole de ta lecture.`,
  ].join("\n");
}

/** Le relevé du critère d'écoute, tel que le produit l'écrit lui-même. */
export function listeningMeasure(share: TalkShare): {
  level: number;
  learned: string;
  missing: string;
} {
  const level = listeningLevelFromTalkShare(share.commercialPct);
  return {
    level,
    learned: `Le commercial a parlé ${share.commercialPct} % du temps, ${share.prospectLabel} ${share.prospectPct} %. Sa plus longue prise de parole fait ${share.longestCommercialRunWords} mots.`,
    missing:
      level >= 4
        ? ""
        : `Laisser davantage parler le prospect : le niveau 4 demande 40 % de parole au plus pour le commercial.`,
  };
}

/* Les lettres accentuées ne sont pas des « \b » : la frontière se pose à la main (« enchanté »). */
const GREETING =
  /(?<![\p{L}])(bonjour|bonsoir|salut|hello|enchanté|enchantée|ravi de|ravie de|merci de prendre|merci d'avoir|vous m'entendez|on peut commencer|je vous propose qu'on)(?![\p{L}])/iu;

/**
 * Vrai quand l'enregistrement a manifestement commencé après l'ouverture du
 * rendez-vous : c'est le prospect qui parle en premier, et les deux premières
 * répliques ne portent ni salutation ni mise en route. Le cadrage ne peut
 * alors pas être jugé (rendez-vous Noz : « Je suis dans. », puis Lisa qui se
 * présente).
 */
export function openingNotRecorded(
  transcript: string,
  hints: TalkShareHints = {},
): boolean {
  const reading = readSpeakers(transcript, hints);
  if (!reading || reading.turns.length < 2) return false;
  if (reading.turns[0].speaker === reading.commercialKey) return false;
  const opening = reading.turns
    .slice(0, 2)
    .map((t) => t.text.join(" "))
    .join(" ");
  return !GREETING.test(opening);
}

/** Une question qui n'en est pas une : elle vérifie qu'on suit, sans rien demander. */
const TAG_QUESTION =
  /(vous voyez(?: ce que je veux dire)?|on est (?:bien )?d'accord|d'accord|c'est ça|n'est-ce pas|non|ok|okay|hein|vous me suivez|ça vous parle|ça va|vous comprenez|voilà|oui)\s*\?$/i;
/** Ce qui ouvre une question : on ne peut pas y répondre par oui ou non. */
const OPEN_QUESTION =
  /(^|[\s,'’])(comment|pourquoi|qu['’]est-ce|quel|quelle|quels|quelles|combien|quand|où|qui|c['’]est quoi|à quoi|de quoi|dans quelle mesure|lequel|laquelle|lesquels|lesquelles|en quoi|qu['’]attendez|que pensez|que faites)(?=[\s,'’?]|$)/i;

/** Les questions du commercial, rangées en trois sortes. */
export type SellerQuestionStats = {
  /** « Comment… ? », « Qu'est-ce qui… ? » : on ne peut pas y répondre par oui ou non. */
  open: number;
  /** « Vous faites de l'inter-entreprise ? » : oui ou non. */
  closed: number;
  /** « Vous voyez ce que je veux dire ? », « on est d'accord ? » : rien n'est demandé. */
  tag: number;
};

/** Range une question du commercial. */
export function classifyQuestion(question: string): keyof SellerQuestionStats {
  const q = question.trim();
  if (TAG_QUESTION.test(q) || q.split(/\s+/).length <= 2) return "tag";
  return OPEN_QUESTION.test(q) ? "open" : "closed";
}

/** Ce que le produit mesure de la conduite du commercial. */
export type SellerConversationMeasures = {
  questions: SellerQuestionStats;
  /**
   * La plus longue prise de parole du commercial qui commence dans le premier
   * tiers du rendez-vous, en mots : un argumentaire déroulé avant que le
   * besoin soit exploré.
   */
  earlyLongestRunWords: number;
};

/**
 * Mesure les questions du commercial et ses longs passages en début de
 * rendez-vous. Rend `null` quand le transcript ne distingue pas ses
 * intervenants.
 */
export function sellerConversationMeasures(
  transcript: string,
  hints: TalkShareHints = {},
): SellerConversationMeasures | null {
  const reading = readSpeakers(transcript, hints);
  if (!reading) return null;
  const questions: SellerQuestionStats = { open: 0, closed: 0, tag: 0 };
  const total = reading.turns.reduce((acc, t) => acc + t.words, 0);
  let seen = 0;
  let earlyLongestRunWords = 0;
  for (const turn of reading.turns) {
    const startsEarly = seen < total / 3;
    seen += turn.words;
    if (turn.speaker !== reading.commercialKey) continue;
    if (startsEarly) {
      earlyLongestRunWords = Math.max(earlyLongestRunWords, turn.words);
    }
    const text = turn.text.join(" ");
    for (const piece of text.split(/(?<=\?)/)) {
      if (!piece.trim().endsWith("?")) continue;
      const sentence = piece.split(/[.!…]\s/).pop() ?? piece;
      questions[classifyQuestion(sentence)] += 1;
    }
  }
  return { questions, earlyLongestRunWords };
}
