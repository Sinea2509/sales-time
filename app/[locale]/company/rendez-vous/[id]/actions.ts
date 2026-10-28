"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAnalysisActor } from "@/lib/analysis-server-context";
import { scheduleAnalysisJobsAfterResponse } from "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs";
import { requireMeetingMutationAccess } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { generateFollowUpEmailForMeeting } from "@/src/core/application/generate-follow-up-email";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import { reviseFollowUpEmail } from "@/src/core/application/revise-follow-up-email";
import { runAllMeetingAnalysesForOrg } from "@/src/core/application/run-all-meeting-analyses-for-org";
import {
  composeFollowUpEmailDraft,
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

const reviseEmailSchema = z.object({
  meetingId: meetingIdSchema,
  subject: z.string().max(300),
  body: z.string().trim().min(1).max(8000),
  instruction: z.string().trim().min(2).max(500),
});

/**
 * Retouche le mail proposé selon la demande du commercial, puis l'enregistre.
 * Même accès que la génération du mail.
 */
export async function reviseFollowUpEmailAction(
  raw: z.input<typeof reviseEmailSchema>,
) {
  const parsed = reviseEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const actor = await requireAnalysisActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsed.data.meetingId,
  );
  if (!access.ok) return { ok: false as const, error: access.error };

  const meeting = await actor.deps.meetings.findMeetingDetailWithAnalyses({
    id: parsed.data.meetingId,
    organizationId: actor.organizationId,
  });
  if (!meeting) return { ok: false as const, error: "NOT_FOUND" as const };

  try {
    const revised = await reviseFollowUpEmail(
      { analysis: actor.deps.analysis, prompts: actor.deps.prompts },
      {
        meeting,
        subject: parsed.data.subject,
        body: parsed.data.body,
        instruction: parsed.data.instruction,
      },
    );
    await actor.deps.meetings.updateMeetingFollowUpDraft({
      id: parsed.data.meetingId,
      organizationId: actor.organizationId,
      followUpEmailDraft: composeFollowUpEmailDraft(
        revised.subject,
        revised.body,
      ),
    });
    revalidatePath(`/company/rendez-vous/${parsed.data.meetingId}`);
    return { ok: true as const, subject: revised.subject, body: revised.body };
  } catch {
    return { ok: false as const, error: "FAILED" as const };
  }
}
