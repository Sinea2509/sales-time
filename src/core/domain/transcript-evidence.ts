/**
 * Retrouver une preuve dans le transcript.
 *
 * Les consignes demandent au modèle de recopier les mots du prospect « tels
 * qu'ils ont été dits ». Une consigne n'est pas une garantie : au premier audit
 * en production, 5 des 38 preuves d'une grille n'étaient pas dans le
 * transcript, dont trois qui recopiaient la définition du critère, notée 4 sur
 * 4. Le produit vérifie donc lui-même, avant d'enregistrer, que chaque extrait
 * se retrouve dans ce qui a été dit.
 *
 * La comparaison se fait mot à mot, sans accents ni ponctuation, et tolère
 * quelques écarts : un mot sur cinq peut différer, manquer ou s'ajouter
 * (« mit » pour « mis », « une proposition » pour « la proposition »). Un
 * extrait de trois mots ou moins doit être exact. Un extrait coupé par des
 * points de suspension se vérifie morceau par morceau, dans l'ordre.
 *
 * Depuis le lot 92, trois règles de plus :
 * - un nombre ne se remplace pas : « on a 50 managers » ne prouve rien si le
 *   prospect a dit « on a 15 managers », même quand le reste de la phrase
 *   est exact. Un chiffre recopié de travers passait pour un écart toléré,
 *   et c'est sur ce chiffre que la grille accorde le niveau 4 ;
 * - un extrait fait au moins trois mots : « Oui. » se retrouve dans tout
 *   transcript et ne prouve rien ;
 * - les morceaux d'un extrait coupé se suivent dans le transcript, à moins de
 *   cent mots l'un de l'autre : deux phrases prises à deux moments du
 *   rendez-vous ne font pas une citation.
 */

/** Les nombres dits en toutes lettres, tels que la grille les reconnaît. */
export const NUMBER_WORDS = [
  "un",
  "une",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "cent",
  "cents",
  "mille",
  "million",
  "millions",
  "milliard",
  "milliards",
  "dizaine",
  "dizaines",
  "douzaine",
  "vingtaine",
  "trentaine",
  "quarantaine",
  "cinquantaine",
  "centaine",
  "centaines",
  "millier",
  "milliers",
  "moitié",
  "tiers",
  "quart",
] as const;

/*
  « un » et « une » sont des articles bien plus souvent que des nombres : ils
  ne comptent pas comme un chiffre dit. « neuf » est un adjectif aussi souvent
  qu'un nombre (« un projet neuf ») : il ne compte pas non plus.
*/
const FIGURE_WORDS = new Set<string>(
  NUMBER_WORDS.filter((w) => w !== "un" && w !== "une"),
);

/** Un mot, déjà normalisé, qui dit un nombre : en chiffres ou en lettres. */
export function isNumberWord(word: string): boolean {
  return /^\d/.test(word) || FIGURE_WORDS.has(word);
}

/**
 * Vrai quand le texte dit un nombre : en chiffres, ou en toutes lettres parmi
 * ceux que l'on dit en rendez-vous (« une quarantaine », « quinze mille »).
 *
 * Une année seule (« en 2025 »), un nom de produit (« Office 365 ») ou un
 * numéro de version ne sont pas un chiffre obtenu du prospect : ils ne
 * comptent pas.
 */
export function hasFigure(text: string): boolean {
  const words = evidenceWords(text);
  return words.some((word, i) => {
    if (FIGURE_WORDS.has(word)) return true;
    if (!/^\d+$/.test(word)) return false;
    const n = Number(word);
    /* Une année, et rien que l'année : « en 2025 », « depuis 2019 ». */
    if (n >= 1900 && n <= 2100 && word.length === 4) {
      const previous = words[i - 1] ?? "";
      return !/^(en|depuis|fin|debut|avant|apres|des|courant|rentree)$/.test(
        previous,
      );
    }
    /* Un numéro accolé à un nom de produit : « Office 365 », « Windows 11 ». */
    const previous = words[i - 1] ?? "";
    if (
      /^(office|windows|sage|sap|dynamics|odoo|cegid|ebp|version|v)$/.test(
        previous,
      )
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Les mots d'un texte, en minuscules, sans accents ni ponctuation.
 *
 * Les tranches de milliers sont recollées : « 15 000 » et « 15000 » donnent
 * le même mot, sans quoi un montant recopié sans espace comptait pour deux
 * écarts.
 */
export function evidenceWords(text: string): string[] {
  const words = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const merged: string[] = [];
  // Vrai quand le dernier mot est déjà un nombre recollé : « 1 500 000 ».
  let lastIsGroupedNumber = false;
  for (const word of words) {
    const previous = merged[merged.length - 1];
    const continuesNumber =
      previous !== undefined &&
      /^\d{3}$/.test(word) &&
      /^\d+$/.test(previous) &&
      (previous.length <= 3 || lastIsGroupedNumber);
    if (continuesNumber) {
      merged[merged.length - 1] = previous + word;
      lastIsGroupedNumber = true;
    } else {
      merged.push(word);
      lastIsGroupedNumber = false;
    }
  }
  return merged;
}

/** Le nombre d'écarts admis pour un extrait de `wordCount` mots. */
export function allowedEvidenceEdits(wordCount: number): number {
  if (wordCount <= 3) return 0;
  return Math.max(1, Math.floor(wordCount / 5));
}

/** Un extrait plus court que ceci, en mots, ne prouve rien. */
export const MIN_EVIDENCE_WORDS = 3;

/** Deux morceaux d'un même extrait se suivent à moins de cette distance, en mots. */
export const MAX_EVIDENCE_PIECE_GAP_WORDS = 100;

/**
 * L'indice du mot du texte où se termine la première occurrence du motif, à
 * `maxEdits` écarts près (mot remplacé, manquant ou ajouté), en cherchant à
 * partir de `from` ; `-1` quand le motif ne s'y trouve pas.
 *
 * C'est la distance d'édition d'un motif à la meilleure sous-suite contiguë du
 * texte : la première ligne est gratuite, le motif peut commencer partout.
 * Un mot du motif qui dit un nombre ne se remplace ni ne se retire : un
 * chiffre recopié de travers n'est pas un écart, c'est une autre citation.
 */
function occursWithin(
  pattern: readonly string[],
  source: readonly string[],
  maxEdits: number,
  from = 0,
): number {
  const n = pattern.length;
  if (n === 0) return from;
  const forbidden = maxEdits + 1;
  const numeric = pattern.map(isNumberWord);
  let prev = new Int32Array(n + 1);
  let cur = new Int32Array(n + 1);
  prev[0] = 0;
  for (let i = 1; i <= n; i += 1) {
    prev[i] = Math.min(
      forbidden,
      prev[i - 1] + (numeric[i - 1] ? forbidden : 1),
    );
  }
  if (prev[n] <= maxEdits) return from;
  for (let j = from + 1; j <= source.length; j += 1) {
    cur[0] = 0;
    const word = source[j - 1];
    for (let i = 1; i <= n; i += 1) {
      const same = pattern[i - 1] === word;
      const substitution =
        prev[i - 1] + (same ? 0 : numeric[i - 1] ? forbidden : 1);
      const skipSourceWord = prev[i] + 1;
      const skipPatternWord = cur[i - 1] + (numeric[i - 1] ? forbidden : 1);
      cur[i] = Math.min(
        substitution,
        skipSourceWord,
        skipPatternWord,
        forbidden,
      );
    }
    if (cur[n] <= maxEdits) return j;
    [prev, cur] = [cur, prev];
  }
  return -1;
}

/** Les morceaux d'un extrait, coupés aux fins de phrase et aux points de suspension. */
function excerptPieces(excerpt: string): string[][] {
  /*
    Morceau par morceau, coupé aux fins de phrase comme aux points de
    suspension : une citation qui court sur deux phrases se retrouve même
    quand le transcript intercale entre elles un nom et un horodatage
    (« Claire Dupont 00:12:34 »), comme ceux de Teams ou de Zoom.
  */
  return excerpt
    .split(/…|\.\.\.|[.!?;]+(?=\s|$)|\n+/)
    .map(evidenceWords)
    .filter((words) => words.length > 0);
}

/**
 * Vrai si l'extrait se retrouve dans le texte source (transcript et notes),
 * mots découpés par `evidenceWords` : chaque morceau à sa place, dans l'ordre,
 * à moins de cent mots du précédent.
 */
export function isExcerptInSource(
  excerpt: string,
  sourceWords: readonly string[],
): boolean {
  const pieces = excerptPieces(excerpt);
  if (pieces.length === 0) return false;
  const total = pieces.reduce((acc, words) => acc + words.length, 0);
  if (total < MIN_EVIDENCE_WORDS) return false;
  let from = 0;
  for (const [index, words] of pieces.entries()) {
    const end = occursWithin(
      words,
      sourceWords,
      allowedEvidenceEdits(words.length),
      from,
    );
    if (end < 0) return false;
    if (index > 0 && end - words.length - from > MAX_EVIDENCE_PIECE_GAP_WORDS) {
      return false;
    }
    from = end;
  }
  return true;
}
