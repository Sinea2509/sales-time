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
  if (res.message) return res.message;
  const failedSuffix = res.failedKind ? ` (${res.failedKind})` : "";
  return `${res.error}${failedSuffix}`;
}
