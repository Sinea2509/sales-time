/**
 * La consigne qui fait foi des noms saisis par le commercial.
 *
 * La transcription automatique écorche souvent un nom propre, d'une lettre
 * ou deux, et le modèle recopiait la faute dans le compte rendu, le
 * score et le coaching (retour de Thomas du 29 octobre 2026). Le nom de
 * l'interlocuteur et celui de son entreprise, tels que le commercial les a
 * saisis, servent donc de référence dans tout le texte écrit.
 *
 * Rend `null` quand le commercial n'a saisi aucun nom : il n'y a alors rien
 * à imposer.
 */
export function referenceNamesInstruction(names: {
  prospectName?: string | null;
  prospectCompany?: string | null;
}): string | null {
  const person = names.prospectName?.trim();
  const company = names.prospectCompany?.trim();
  const lines = [
    person ? `- Interlocuteur : « ${person} »` : null,
    company && company !== person ? `- Entreprise : « ${company} »` : null,
  ].filter((line): line is string => line !== null);
  if (lines.length === 0) return null;
  return [
    "## Noms de référence (saisis par le commercial, ils font foi)",
    ...lines,
    "Écris ces noms exactement ainsi, partout dans ta réponse, même quand le transcript les orthographie autrement : la transcription automatique écorche souvent les noms propres.",
  ].join("\n");
}
