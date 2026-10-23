"use server";

import { revalidatePath } from "next/cache";
import { requireAnalysisActor } from "@/lib/analysis-server-context";
import { scheduleAnalysisJobsAfterResponse } from "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs";
import { requireMeetingMutationAccess } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { generateFollowUpEmailForMeeting } from "@/src/core/application/generate-follow-up-email";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import { runAllMeetingAnalysesForOrg } from "@/src/core/application/run-all-meeting-analyses-for-org";
import {
  formatFollowUpEmailBody,
  formatFollowUpEmailDraft,
} from "@/src/core/domain/format-follow-up-email-draft";

export async function runAllMeetingAnalysesAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success)
    return { ok: false as const, error: "VALIDATION" as const };

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsed.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }

  const result = await runAllMeetingAnalysesForOrg(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: parsed.data,
    notifyOnComplete: false,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error as "ANALYSIS_FAILED",
      message: result.message,
      failedKind: result.failedKind,
    };
  }

  revalidatePath(`/company/rendez-vous/${parsed.data}`);
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const };
}

export async function retryMeetingAnalysisAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsed.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }

  const meeting = access.meeting;

  if (meeting.status !== "PROCESSING" && meeting.status !== "FAILED") {
    return { ok: false as const, error: "NOT_RETRYABLE" as const };
  }

  await actor.deps.meetings.updateMeetingStatus({
    id: meeting.id,
    organizationId: actor.organizationId,
    status: "PROCESSING",
    errorMessage: null,
  });
  await actor.deps.analysisJobs.enqueueMeetingAnalysis({
    organizationId: actor.organizationId,
    meetingId: meeting.id,
  });
  scheduleAnalysisJobsAfterResponse();

  revalidatePath(`/company/rendez-vous/${parsed.data}`);
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const };
}

export async function generateFollowUpEmailAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success)
    return { ok: false as const, error: "VALIDATION" as const };

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsed.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }

  const meeting = await actor.deps.meetings.findMeetingDetailWithAnalyses({
    id: parsed.data,
    organizationId: actor.organizationId,
  });
  if (!meeting) return { ok: false as const, error: "NOT_FOUND" as const };

  const settings = await actor.deps.organizationSettings.findByOrganizationId(
    actor.organizationId,
  );
  const emailPreferences = await loadResolvedFollowUpEmailPreferences(
    { organizationTeam: actor.deps.organizationTeam },
    {
      organizationId: actor.organizationId,
      sellerUserId: meeting.sellerUserId,
      organizationSettings: settings,
    },
  );

  try {
    const email = await generateFollowUpEmailForMeeting(
      {
        analysis: actor.deps.analysis,
        prompts: actor.deps.prompts,
        organizationPrompts: actor.deps.organizationPrompts,
      },
      {
        organizationId: actor.organizationId,
        meeting,
        emailPreferences,
      },
    );
    const subject = email.subject;
    const body = formatFollowUpEmailBody(email);
    const draft = formatFollowUpEmailDraft(email);

    await actor.deps.meetings.updateMeetingFollowUpDraft({
      id: parsed.data,
      organizationId: actor.organizationId,
      followUpEmailDraft: draft,
    });

    revalidatePath(`/company/rendez-vous/${parsed.data}`);
    return { ok: true as const, subject, body, draft };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false as const, error: "FAILED" as const, message };
  }
}

/**
 * Relance l'analyse d'un rendez-vous déjà analysé, pour qu'il profite d'une
 * règle corrigée (la mesure de l'écoute sur les transcripts Teams, par
 * exemple). Demande de Thomas du 23 octobre 2026.
 *
 * Comme une modification du transcript, la relance consomme une analyse
 * d'essai, et le compte rendu est effacé pour être réécrit avec les nouvelles
 * notes.
 */
export async function reanalyzeMeetingAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsed.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }
  if (access.meeting.status === "PROCESSING") {
    return { ok: false as const, error: "ALREADY_RUNNING" as const };
  }

  const left = await actor.deps.organizationQuota.getTrialAnalysesLeft(
    actor.organizationId,
  );
  if (left <= 0) {
    return { ok: false as const, error: "QUOTA_EXHAUSTED" as const };
  }
  await actor.deps.organizationQuota.decrementTrialAnalysesLeft(
    actor.organizationId,
  );

  await actor.deps.meetings.updateMeetingVisitReportDraft({
    id: parsed.data,
    organizationId: actor.organizationId,
    visitReportDraft: null,
  });
  await actor.deps.meetings.updateMeetingStatus({
    id: parsed.data,
    organizationId: actor.organizationId,
    status: "PROCESSING",
    errorMessage: null,
  });
  await actor.deps.analysisJobs.enqueueMeetingAnalysis({
    organizationId: actor.organizationId,
    meetingId: parsed.data,
  });
  scheduleAnalysisJobsAfterResponse();

  revalidatePath(`/company/rendez-vous/${parsed.data}`);
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const };
}
