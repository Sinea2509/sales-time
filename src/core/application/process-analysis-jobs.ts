import { runAllMeetingAnalysesForOrg } from "./run-all-meeting-analyses-for-org";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";

const STALE_MINUTES = 10;
const JOBS_PER_RUN = 3;

export type ProcessAnalysisJobsResult = {
  processed: number;
  succeeded: number;
  failed: number;
  releasedStale: number;
};

export async function processAnalysisJobs(
  deps: {
    analysisJobs: AnalysisJobRepositoryPort;
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
    aiLogs: AiRequestLogRepositoryPort;
    globalKissCoachingPrompts: GlobalKissCoachingPromptsRepositoryPort;
    notifications: NotificationRepositoryPort;
    users: import("@/src/core/ports/user-repository-port").UserRepositoryPort;
  },
  input: { workerId: string },
): Promise<ProcessAnalysisJobsResult> {
  const staleBefore = new Date(Date.now() - STALE_MINUTES * 60_000);
  const releasedStale = await deps.analysisJobs.releaseStaleProcessingJobs(
    staleBefore,
  );

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < JOBS_PER_RUN; i += 1) {
    const job = await deps.analysisJobs.dequeueNextJob(input.workerId);
    if (!job) break;

    processed += 1;
    const meeting = await deps.meetings.findMeetingByIdForOrg({
      id: job.meetingId,
      organizationId: job.organizationId,
    });
    if (!meeting) {
      await deps.analysisJobs.markJobFailed({
        jobId: job.id,
        error: "Meeting not found",
        requeue: false,
      });
      failed += 1;
      continue;
    }

    const runResult = await runAllMeetingAnalysesForOrg(
      {
        meetings: deps.meetings,
        prompts: deps.prompts,
        analysis: deps.analysis,
        aiLogs: deps.aiLogs,
        globalKissCoachingPrompts: deps.globalKissCoachingPrompts,
        notifications: deps.notifications,
        users: deps.users,
      },
      {
        organizationId: job.organizationId,
        meetingId: job.meetingId,
        jobId: job.id,
        notifyOnComplete: true,
      },
    );

    if (runResult.ok) {
      await deps.analysisJobs.markJobDone(job.id);
      succeeded += 1;
    } else {
      await deps.analysisJobs.markJobFailed({
        jobId: job.id,
        error: runResult.message ?? runResult.error,
        requeue: job.attempts < job.maxAttempts,
      });
      failed += 1;
    }
  }

  return { processed, succeeded, failed, releasedStale };
}
