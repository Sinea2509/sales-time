"use server";

import { revalidatePath } from "next/cache";
import {
  requireAnalysisActor,
} from "@/lib/analysis-server-context";
import { loadCommercialKissAppendix } from "@/lib/kiss-commercial-appendix";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { generateFollowUpEmailForMeeting } from "@/src/core/application/generate-follow-up-email";
import { loadResolvedFollowUpEmailPreferences } from "@/src/core/application/load-resolved-follow-up-email-preferences";
import { runMeetingAnalysis } from "@/src/core/application/run-meeting-analysis";
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

  const kissAppendix = await loadCommercialKissAppendix(actor.deps);
  for (const kind of ["SONCAS", "DISC", "KISS"] as const) {
    const r = await runMeetingAnalysis(actor.deps, {
      organizationId: actor.organizationId,
      meetingId: parsed.data,
      kind,
      kissSystemMarkdownAppendix: kind === "KISS" ? kissAppendix : undefined,
    });
    if (!r.ok) {
      return {
        ok: false as const,
        error: r.error,
        message: r.message,
        failedKind: kind,
      };
    }
  }

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
      { analysis: actor.deps.analysis, prompts: actor.deps.prompts },
      {
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

