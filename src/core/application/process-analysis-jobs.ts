import { discResultSchema, soncasResultSchema } from "@/src/core/domain/analysis-result-zod";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";
import { runMeetingAnalysis } from "./run-meeting-analysis";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { sendTransactionalEmail } from "@/lib/email/mailer";

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

  const globalKissJson = await deps.globalKissCoachingPrompts.getPrompts();
  const kissAppendix = kissMarkdownAppendixForAudience(
    globalKissJson,
    "commercial",
  );

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

    await deps.meetings.updateMeetingStatus({
      id: meeting.id,
      organizationId: meeting.organizationId,
      status: "PROCESSING",
      errorMessage: null,
    });

    let jobOk = true;
    let lastError = "";

    for (const kind of ["SONCAS", "DISC", "KISS"] as const) {
      const r = await runMeetingAnalysis(
        {
          meetings: deps.meetings,
          prompts: deps.prompts,
          analysis: deps.analysis,
          aiLogs: deps.aiLogs,
        },
        {
          organizationId: job.organizationId,
          meetingId: job.meetingId,
          kind,
          jobId: job.id,
          kissSystemMarkdownAppendix:
            kind === "KISS" ? kissAppendix : undefined,
        },
      );
      if (!r.ok) {
        jobOk = false;
        lastError = r.message ?? r.error;
        break;
      }
    }

    if (jobOk) {
      const disc = await deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: job.organizationId,
        kind: "DISC",
      });
      const soncas = await deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: job.organizationId,
        kind: "SONCAS",
      });
      const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
      const soncasParsed = soncas
        ? soncasResultSchema.safeParse(soncas.result)
        : null;
      if (discParsed?.success || soncasParsed?.success) {
        await deps.meetings.updatePersonProfileCache({
          personId: meeting.personId,
          organizationId: job.organizationId,
          discDominant: discParsed?.success ? discParsed.data.dominant : undefined,
          soncasDominant: soncasParsed?.success
            ? soncasParsed.data.dominant
            : undefined,
        });
      }

      await deps.meetings.updateMeetingStatus({
        id: meeting.id,
        organizationId: job.organizationId,
        status: "READY",
        errorMessage: null,
      });
      await deps.analysisJobs.markJobDone(job.id);

      await deps.notifications.create({
        organizationId: job.organizationId,
        userId: meeting.sellerUserId,
        title: "Analyse terminée",
        body: `Votre rendez-vous avec ${meeting.prospectName} est prêt.`,
        href: `/company/rendez-vous/${meeting.id}`,
      });

      const sellerEmail = await deps.users.findEmailById(meeting.sellerUserId);
      if (sellerEmail) {
        await sendTransactionalEmail({
          to: sellerEmail,
          subject: "Sales Time — votre analyse de RDV est prête",
          html: `<p>Bonjour,</p><p>L'analyse de votre rendez-vous avec <strong>${meeting.prospectName}</strong> est disponible.</p><p><a href="${process.env.APP_BASE_URL ?? ""}/company/rendez-vous/${meeting.id}">Voir la fiche RDV</a></p>`,
        }).catch(() => undefined);
      }

      succeeded += 1;
    } else {
      await deps.meetings.updateMeetingStatus({
        id: meeting.id,
        organizationId: job.organizationId,
        status: "FAILED",
        errorMessage: lastError,
      });
      await deps.analysisJobs.markJobFailed({
        jobId: job.id,
        error: lastError,
        requeue: job.attempts < job.maxAttempts,
      });
      failed += 1;
    }
  }

  return { processed, succeeded, failed, releasedStale };
}
