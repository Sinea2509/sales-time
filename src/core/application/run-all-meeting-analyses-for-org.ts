import { discResultSchema, soncasResultSchema } from "@/src/core/domain/analysis-result-zod";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";
import type {
  MeetingAnalysisKind,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";
import { runMeetingAnalysis } from "./run-meeting-analysis";

export type RunAllMeetingAnalysesResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      message?: string;
      failedKind?: MeetingAnalysisKind;
    };

export async function runAllMeetingAnalysesForOrg(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
    aiLogs?: AiRequestLogRepositoryPort;
    globalKissCoachingPrompts?: GlobalKissCoachingPromptsRepositoryPort;
    notifications?: NotificationRepositoryPort;
    users?: UserRepositoryPort;
  },
  input: {
    organizationId: string;
    meetingId: string;
    jobId?: string | null;
    notifyOnComplete?: boolean;
  },
): Promise<RunAllMeetingAnalysesResult> {
  const meeting = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) {
    return { ok: false, error: "MEETING_NOT_FOUND" };
  }

  await deps.meetings.updateMeetingStatus({
    id: meeting.id,
    organizationId: input.organizationId,
    status: "PROCESSING",
    errorMessage: null,
  });

  const globalKissJson = deps.globalKissCoachingPrompts
    ? await deps.globalKissCoachingPrompts.getPrompts()
    : null;
  const kissAppendix = kissMarkdownAppendixForAudience(
    globalKissJson,
    "commercial",
  );

  let lastError = "";
  let failedKind: MeetingAnalysisKind | undefined;

  for (const kind of ["SONCAS", "DISC", "KISS"] as const) {
    const r = await runMeetingAnalysis(
      {
        meetings: deps.meetings,
        prompts: deps.prompts,
        analysis: deps.analysis,
        aiLogs: deps.aiLogs,
      },
      {
        organizationId: input.organizationId,
        meetingId: input.meetingId,
        kind,
        jobId: input.jobId ?? null,
        kissSystemMarkdownAppendix:
          kind === "KISS" ? kissAppendix : undefined,
      },
    );
    if (!r.ok) {
      lastError = r.message ?? r.error;
      failedKind = kind;
      break;
    }
  }

  if (failedKind) {
    await deps.meetings.updateMeetingStatus({
      id: meeting.id,
      organizationId: input.organizationId,
      status: "FAILED",
      errorMessage: lastError,
    });
    return {
      ok: false,
      error: "ANALYSIS_FAILED",
      message: lastError,
      failedKind,
    };
  }

  const disc = await deps.meetings.findLatestAnalysisForMeeting({
    meetingId: meeting.id,
    organizationId: input.organizationId,
    kind: "DISC",
  });
  const soncas = await deps.meetings.findLatestAnalysisForMeeting({
    meetingId: meeting.id,
    organizationId: input.organizationId,
    kind: "SONCAS",
  });
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
  const soncasParsed = soncas ? soncasResultSchema.safeParse(soncas.result) : null;
  if (discParsed?.success || soncasParsed?.success) {
    await deps.meetings.updatePersonProfileCache({
      personId: meeting.personId,
      organizationId: input.organizationId,
      discDominant: discParsed?.success ? discParsed.data.dominant : undefined,
      soncasDominant: soncasParsed?.success
        ? soncasParsed.data.dominant
        : undefined,
    });
  }

  await deps.meetings.updateMeetingStatus({
    id: meeting.id,
    organizationId: input.organizationId,
    status: "READY",
    errorMessage: null,
  });

  if (input.notifyOnComplete !== false && deps.notifications) {
    await deps.notifications.create({
      organizationId: input.organizationId,
      userId: meeting.sellerUserId,
      title: "Analyse terminée",
      body: `Votre rendez-vous avec ${meeting.prospectName} est prêt.`,
      href: `/company/rendez-vous/${meeting.id}`,
    });

    if (deps.users) {
      const sellerEmail = await deps.users.findEmailById(meeting.sellerUserId);
      if (sellerEmail) {
        await sendTransactionalEmail({
          to: sellerEmail,
          subject: "Sales Time — votre analyse de RDV est prête",
          html: `<p>Bonjour,</p><p>L'analyse de votre rendez-vous avec <strong>${meeting.prospectName}</strong> est disponible.</p><p><a href="${process.env.APP_BASE_URL ?? ""}/company/rendez-vous/${meeting.id}">Voir la fiche RDV</a></p>`,
        }).catch(() => undefined);
      }
    }
  }

  return { ok: true };
}
