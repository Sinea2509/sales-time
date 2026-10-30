import { estimatedModelCostUsd } from "@/lib/analysis-gateway-models";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type PlatformAiKpis = {
  aiCalls30d: number;
  aiErrors30d: number;
  estimatedCostUsd30d: number;
  failedMeetings: number;
  readyMeetings: number;
  analysisFailureRatePct: number | null;
};

export async function getPlatformAiKpis(
  deps: {
    aiLogs: AiRequestLogRepositoryPort;
    meetings: MeetingRepositoryPort;
  },
  since: Date,
): Promise<PlatformAiKpis> {
  const [logStats, meetingStats] = await Promise.all([
    deps.aiLogs.getAggregateSince(since),
    deps.meetings.countByAnalysisStatus(),
  ]);

  const totalAnalysed = meetingStats.ready + meetingStats.failed;
  const failureRate =
    totalAnalysed > 0
      ? Math.round((meetingStats.failed / totalAnalysed) * 1000) / 10
      : null;

  /*
    Chaque modèle à son tarif. Un seul tarif moyen comptait Claude Haiku 5.5
    vingt fois trop cher : 15,36 $ affichés le 30 octobre 2026 pour environ
    8,40 $ réels.
  */
  const estimatedCostUsd30d =
    Math.round(
      logStats.tokensByModel.reduce(
        (total, usage) => total + estimatedModelCostUsd(usage),
        0,
      ) * 100,
    ) / 100;

  return {
    aiCalls30d: logStats.totalCalls,
    aiErrors30d: logStats.errorCalls,
    estimatedCostUsd30d,
    failedMeetings: meetingStats.failed,
    readyMeetings: meetingStats.ready,
    analysisFailureRatePct: failureRate,
  };
}
