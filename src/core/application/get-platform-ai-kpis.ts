import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/** Rough USD estimate (AI Gateway blended rate). */
const INPUT_USD_PER_TOKEN = 0.000002;
const OUTPUT_USD_PER_TOKEN = 0.000008;

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

  const estimatedCostUsd30d =
    Math.round(
      (logStats.inputTokens * INPUT_USD_PER_TOKEN +
        logStats.outputTokens * OUTPUT_USD_PER_TOKEN) *
        100,
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
