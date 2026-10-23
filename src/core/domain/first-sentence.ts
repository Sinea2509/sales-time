/**
 * La première phrase d'un texte, pour l'annoncer en une ligne là où le texte
 * entier se lit plus loin.
 *
 * Coupée au premier point, point d'interrogation ou d'exclamation suivi d'un
 * espace. Une phrase plus longue que `max` caractères s'arrête au dernier mot
 * entier, suivie de « … ». `null` pour un texte vide.
 */
export function firstSentence(
  text: string | null | undefined,
  max = 220,
): string | null {
  const t = text?.replace(/\s+/g, " ").trim();
  if (!t) return null;
  const end = t.search(/[.!?…](?=\s|$)/);
  const sentence = end >= 0 ? t.slice(0, end + 1) : t;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, "")}…`;
}
