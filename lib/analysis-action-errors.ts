export const AI_NOT_CONFIGURED_MSG =
  "Analyse IA indisponible : configurez AI_GATEWAY_API_KEY (voir docs/env-sync.md).";

export function formatMeetingAnalysisActionError(res: {
  error: string;
  message?: string;
  failedKind?: string;
}): string {
  if (res.error === "AI_NOT_CONFIGURED") return AI_NOT_CONFIGURED_MSG;
  if (res.error === "PROMPT_NOT_CONFIGURED") {
    return "Exécutez le seed Prisma (prompts manquants).";
  }
  /*
    Rien n'a échoué : ce type de rendez-vous n'a pas encore de grille. Le dire
    ainsi, plutôt que de laisser passer un code technique, évite au commercial
    de chercher une panne là où il n'y en a pas.
  */
  if (res.error === "NO_SCORECARD_GRID") {
    return "Pas de grille de scorecard pour ce type de rendez-vous.";
  }
  if (res.message) return res.message;
  const failedSuffix = res.failedKind ? ` (${res.failedKind})` : "";
  return `${res.error}${failedSuffix}`;
}
