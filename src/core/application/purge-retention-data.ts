import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { FeedbackRepositoryPort } from "@/src/core/ports/feedback-repository-port";

const RETENTION_DAYS = 30;

export async function purgeRetentionData(deps: {
  aiLogs: AiRequestLogRepositoryPort;
  feedbacks: FeedbackRepositoryPort;
}) {
  const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const [aiLogsPurged, feedbacksPurged] = await Promise.all([
    deps.aiLogs.purgeOlderThan(before),
    deps.feedbacks.purgeOlderThan(before),
  ]);
  return { aiLogsPurged, feedbacksPurged, before };
}
