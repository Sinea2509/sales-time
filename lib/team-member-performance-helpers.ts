/*
  `postureLabelFromMeetings` vivait ici : elle prenait le levier SONCAS
  dominant le plus fréquent chez les prospects rencontrés et l'affichait sous
  le nom du commercial, comme si c'était un trait de lui. Ce que la fiche
  montre désormais à cet endroit se calcule sur ses six compétences de vendeur,
  comparées à celles de son équipe, dans
  `src/core/domain/seller-skill-signature.ts`.
*/

export function performanceParagraphText(
  text: string | undefined,
  options: {
    hasSummary: boolean;
    meetingCount: number;
    aiEnabled: boolean;
  },
): string | null {
  const trimmed = text?.trim();
  if (trimmed) return trimmed;
  if (!options.hasSummary) {
    if (options.meetingCount === 0) {
      return "Pas assez de données pour une analyse";
    }
    return options.aiEnabled
      ? "La synthèse automatique n’a pas pu être produite. Réessayez plus tard."
      : "Pour générer ce texte à partir des transcriptions et des analyses (SONCAS, DISC, KISS), configurez AI_GATEWAY_API_KEY.";
  }
  return "Ce bloc n’a pas été renseigné par la synthèse.";
}
