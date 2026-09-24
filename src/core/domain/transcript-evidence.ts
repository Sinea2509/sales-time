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
 * points de suspension se vérifie morceau par morceau.
 */

/** Les mots d'un texte, en minuscules, sans accents ni ponctuation. */
export function evidenceWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Le nombre d'écarts admis pour un extrait de `wordCount` mots. */
export function allowedEvidenceEdits(wordCount: number): number {
  if (wordCount <= 3) return 0;
  return Math.max(1, Math.floor(wordCount / 5));
}

/**
 * Vrai si les mots de `pattern` se retrouvent dans `source` à au plus
 * `maxEdits` écarts près (mot remplacé, manquant ou ajouté), n'importe où.
 *
 * C'est la distance d'édition d'un motif à la meilleure sous-suite contiguë du
 * texte : la première ligne est gratuite, le motif peut commencer partout.
 */
function occursWithin(
  pattern: readonly string[],
  source: readonly string[],
  maxEdits: number,
): boolean {
  const n = pattern.length;
  if (n === 0) return true;
  let prev = new Int32Array(n + 1);
  let cur = new Int32Array(n + 1);
  for (let i = 0; i <= n; i += 1) prev[i] = i;
  if (prev[n] <= maxEdits) return true;
  for (let j = 1; j <= source.length; j += 1) {
    cur[0] = 0;
    const word = source[j - 1];
    for (let i = 1; i <= n; i += 1) {
      const substitution = prev[i - 1] + (pattern[i - 1] === word ? 0 : 1);
      const skipSourceWord = prev[i] + 1;
      const skipPatternWord = cur[i - 1] + 1;
      cur[i] = Math.min(substitution, skipSourceWord, skipPatternWord);
    }
    if (cur[n] <= maxEdits) return true;
    [prev, cur] = [cur, prev];
  }
  return false;
}

/**
 * Vrai si l'extrait se retrouve dans le texte source (transcript et notes),
 * mots découpés par `evidenceWords`.
 */
export function isExcerptInSource(
  excerpt: string,
  sourceWords: readonly string[],
): boolean {
  const pieces = excerpt
    .split(/…|\.\.\./)
    .map(evidenceWords)
    .filter((words) => words.length > 0);
  if (pieces.length === 0) return false;
  return pieces.every((words) =>
    occursWithin(words, sourceWords, allowedEvidenceEdits(words.length)),
  );
}
