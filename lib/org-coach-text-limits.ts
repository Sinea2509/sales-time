/**
 * Les longueurs admises pour le pitch et le vocabulaire métier de
 * l'organisation, dans l'onboarding comme dans Paramètres, Coach IA.
 *
 * Elles étaient de 500 caractères, et le champ coupait le texte sans prévenir,
 * au milieu d'un mot : l'IA recevait un pitch tronqué. La limite est relevée,
 * et un texte trop long est signalé au lieu d'être coupé.
 */
export const ORG_PITCH_MAX = 2000;
export const ORG_VOCABULARY_MAX = 2000;

/** Le message affiché quand un texte dépasse sa limite, ou `null`. */
export function orgCoachTextTooLongMessage(input: {
  companyPitch: string;
  industryVocabulary: string;
}): string | null {
  if (input.companyPitch.length > ORG_PITCH_MAX) {
    return `Le pitch dépasse ${ORG_PITCH_MAX.toLocaleString("fr-FR")} caractères : raccourcissez-le avant d'enregistrer.`;
  }
  if (input.industryVocabulary.length > ORG_VOCABULARY_MAX) {
    return `Le vocabulaire métier dépasse ${ORG_VOCABULARY_MAX.toLocaleString("fr-FR")} caractères : raccourcissez-le avant d'enregistrer.`;
  }
  return null;
}
