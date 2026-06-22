"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateTeamMemberPerformancePaths } from "@/lib/revalidate-team-member-paths";
import { uploadMeetingTranscriptFile } from "@/lib/meeting-transcript-upload";
import { blobUrlBelongsToOrg } from "@/lib/blob-paths";
import { mergeMeetingTranscriptSources } from "@/lib/transcript-extract";
import { scheduleAnalysisJobsAfterResponse } from "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { requireMeetingMutationAccess } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { createMeetingForOrg } from "@/src/core/application/create-meeting";
import { updateMeetingForOrg } from "@/src/core/application/update-meeting-for-org";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";

const meetingOutcomeSchema = z.enum([
  "WON",
  "LOST",
  "FOLLOW_UP",
  "NO_SHOW",
  "OTHER",
]);

const createMeetingSchema = z.object({
  personId: z.preprocess(
    (v) => {
      if (v == null || v === "") return null;
      return typeof v === "string" ? v.trim() : v;
    },
    z.union([z.null(), z.string().cuid()]),
  ),
  prospectName: z.string().trim().min(1).max(200),
  meetingAt: z.coerce.date(),
  durationMin: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int()
        .min(0)
        .max(24 * 60),
    ])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  transcript: z.string().trim().max(200_000),
  notes: z
    .string()
    .trim()
    .max(10_000)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  meetingType: z.preprocess(
    (v) => (v == null || v === "" ? null : v),
    z.union([z.null(), z.string().trim().max(120)]),
  ),
  pipelineStage: z.preprocess(
    (v) => (v == null || v === "" ? null : v),
    z.union([z.null(), z.string().trim().max(120)]),
  ),
  potentialAmount: z.preprocess(
    (v) => {
      if (v == null || v === "") return null;
      const n = typeof v === "string" ? Number(v) : Number(v);
      return Number.isFinite(n) ? n : null;
    },
    z.union([z.null(), z.number().min(0).max(1e12)]),
  ),
  outcome: meetingOutcomeSchema,
  feeling: z.coerce.number().int().min(1).max(5).optional().nullable(),
});

export async function getOrgMeetingFormOptionsAction(): Promise<
  | {
      ok: true;
      meetingTypeOptions: string[];
      pipelineStageOptions: string[];
    }
  | { ok: false; error: "UNAUTHENTICATED" | "NO_ORG" }
> {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false, error: actor.error };

  const settings = await actor.deps.organizationSettings.findByOrganizationId(
    actor.organizationId,
  );

  return {
    ok: true,
    ...orgMeetingFormOptionsFromSettings(settings),
  };
}

export async function createMeetingAction(formData: FormData) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const file = formData.get("transcriptFile");
  let sourceType: "TRANSCRIPT" | "UPLOAD" = "TRANSCRIPT";
  let sourceBlobUrl: string | null = null;
  let transcriptFromFile = "";

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadMeetingTranscriptFile({
      organizationId: actor.organizationId,
      file,
    });
    if (!uploaded.ok) {
      return { ok: false as const, error: uploaded.error };
    }
    transcriptFromFile = uploaded.transcript;
    sourceBlobUrl = uploaded.blobUrl || null;
    sourceType = "UPLOAD";
  }

  const pastedTranscript = String(formData.get("transcript") ?? "").trim();
  const transcript = mergeMeetingTranscriptSources(
    transcriptFromFile,
    pastedTranscript,
  );

  if (transcript.length < 1) {
    return { ok: false as const, error: "VALIDATION" };
  }

  if (
    sourceBlobUrl &&
    !blobUrlBelongsToOrg(sourceBlobUrl, actor.organizationId)
  ) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const parsed = createMeetingSchema.safeParse({
    personId: formData.get("personId") ?? "",
    prospectName: formData.get("prospectName") ?? "",
    meetingAt: formData.get("meetingAt") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    transcript,
    notes: formData.get("notes") ?? "",
    meetingType: formData.get("meetingType") ?? "",
    pipelineStage: formData.get("pipelineStage") ?? "",
    potentialAmount: formData.get("potentialAmount") ?? "",
    outcome: formData.get("outcome") ?? "",
    feeling: formData.get("feeling") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const result = await createMeetingForOrg(actor.deps, {
    organizationId: actor.organizationId,
    sellerInternalUserId: actor.actorUserId,
    personId: parsed.data.personId,
    prospectName: parsed.data.prospectName,
    meetingAt: parsed.data.meetingAt,
    durationMin: parsed.data.durationMin,
    meetingType: parsed.data.meetingType,
    pipelineStage: parsed.data.pipelineStage,
    potentialAmount: parsed.data.potentialAmount,
    transcript: parsed.data.transcript,
    notes: parsed.data.notes,
    outcome: parsed.data.outcome,
    feeling: parsed.data.feeling ?? null,
    sourceType,
    sourceBlobUrl,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.error === "INVALID_PERSON"
          ? ("INVALID_PERSON" as const)
          : result.error === "QUOTA_EXHAUSTED"
            ? ("QUOTA_EXHAUSTED" as const)
            : result.error,
    };
  }

  scheduleAnalysisJobsAfterResponse();

  revalidatePath("/company/rendez-vous");
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  revalidateTeamMemberPerformancePaths(actor.actorUserId);
  return {
    ok: true as const,
    meetingId: result.meetingId,
    sellerUserId: actor.actorUserId,
  };
}

export type MeetingEditPayload = {
  meetingId: string;
  personId: string;
  prospectName: string;
  meetingAtIso: string;
  durationMin: number | null;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  outcome: z.infer<typeof meetingOutcomeSchema>;
  feeling: number | null;
  transcript: string;
  notes: string | null;
};

export async function getMeetingForEditAction(meetingId: string): Promise<
  | { ok: true; meeting: MeetingEditPayload }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "NO_ORG" | "VALIDATION" | "NOT_FOUND" | "FORBIDDEN";
    }
> {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false, error: "VALIDATION" };
  }

  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsedId.data,
  );
  if (!access.ok) return { ok: false, error: access.error };

  const m = access.meeting;
  return {
    ok: true,
    meeting: {
      meetingId: m.id,
      personId: m.personId,
      prospectName: m.prospectName,
      meetingAtIso: m.meetingAt.toISOString(),
      durationMin: m.durationMin,
      meetingType: m.meetingType,
      pipelineStage: m.pipelineStage,
      potentialAmount: m.potentialAmount,
      outcome: m.outcome,
      feeling: m.feeling,
      transcript: m.transcript,
      notes: m.notes,
    },
  };
}

export async function updateMeetingAction(formData: FormData) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const meetingIdRaw = formData.get("meetingId");
  const parsedId = meetingIdSchema.safeParse(meetingIdRaw);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsedId.data,
  );
  if (!access.ok) {
    return {
      ok: false as const,
      error: access.error === "FORBIDDEN" ? ("FORBIDDEN" as const) : ("NOT_FOUND" as const),
    };
  }

  const file = formData.get("transcriptFile");
  let sourceType: "TRANSCRIPT" | "UPLOAD" | undefined;
  let sourceBlobUrl: string | null | undefined;
  let transcriptFromFile = "";

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadMeetingTranscriptFile({
      organizationId: actor.organizationId,
      file,
    });
    if (!uploaded.ok) {
      return { ok: false as const, error: uploaded.error };
    }
    transcriptFromFile = uploaded.transcript;
    sourceBlobUrl = uploaded.blobUrl || null;
    sourceType = "UPLOAD";
  }

  const pastedTranscript = String(formData.get("transcript") ?? "").trim();
  const transcript = mergeMeetingTranscriptSources(
    transcriptFromFile,
    pastedTranscript || access.meeting.transcript,
  );

  if (transcript.length < 1) {
    return { ok: false as const, error: "VALIDATION" };
  }

  if (
    sourceBlobUrl &&
    !blobUrlBelongsToOrg(sourceBlobUrl, actor.organizationId)
  ) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const parsed = createMeetingSchema.safeParse({
    personId: formData.get("personId") ?? "",
    prospectName: formData.get("prospectName") ?? "",
    meetingAt: formData.get("meetingAt") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    transcript,
    notes: formData.get("notes") ?? "",
    meetingType: formData.get("meetingType") ?? "",
    pipelineStage: formData.get("pipelineStage") ?? "",
    potentialAmount: formData.get("potentialAmount") ?? "",
    outcome: formData.get("outcome") ?? "",
    feeling: formData.get("feeling") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const result = await updateMeetingForOrg(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: parsedId.data,
    personId: parsed.data.personId,
    prospectName: parsed.data.prospectName,
    meetingAt: parsed.data.meetingAt,
    durationMin: parsed.data.durationMin,
    meetingType: parsed.data.meetingType,
    pipelineStage: parsed.data.pipelineStage,
    potentialAmount: parsed.data.potentialAmount,
    transcript: parsed.data.transcript,
    notes: parsed.data.notes,
    outcome: parsed.data.outcome,
    feeling: parsed.data.feeling ?? null,
    sourceType,
    sourceBlobUrl,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.error === "INVALID_PERSON"
          ? ("INVALID_PERSON" as const)
          : ("NOT_FOUND" as const),
    };
  }

  const transcriptChanged =
    parsed.data.transcript !== access.meeting.transcript.trim();
  const notesChanged =
    (parsed.data.notes ?? null) !==
    (access.meeting.notes?.trim() ? access.meeting.notes.trim() : null);

  if (transcriptChanged || notesChanged) {
    const left = await actor.deps.organizationQuota.getTrialAnalysesLeft(
      actor.organizationId,
    );
    if (left > 0) {
      await actor.deps.organizationQuota.decrementTrialAnalysesLeft(
        actor.organizationId,
      );
      await actor.deps.meetings.updateMeetingStatus({
        id: parsedId.data,
        organizationId: actor.organizationId,
        status: "PROCESSING",
        errorMessage: null,
      });
      await actor.deps.analysisJobs.enqueueMeetingAnalysis({
        organizationId: actor.organizationId,
        meetingId: parsedId.data,
      });
      scheduleAnalysisJobsAfterResponse();
    }
  }

  revalidatePath("/company/rendez-vous");
  revalidatePath(`/company/rendez-vous/${parsedId.data}`);
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  revalidateTeamMemberPerformancePaths(access.meeting.sellerUserId);
  return {
    ok: true as const,
    meetingId: result.meetingId,
    sellerUserId: access.meeting.sellerUserId,
  };
}

export async function deleteMeetingAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const access = await requireMeetingMutationAccess(
    actor.deps.meetings,
    actor,
    parsedId.data,
  );
  if (!access.ok) {
    return { ok: false as const, error: access.error };
  }

  const sellerUserId = access.meeting.sellerUserId;

  await actor.deps.meetings.deleteMeetingByIdForOrg({
    id: access.meeting.id,
    organizationId: actor.organizationId,
  });

  revalidatePath("/company/rendez-vous");
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  revalidateTeamMemberPerformancePaths(sellerUserId);
  return { ok: true as const, sellerUserId };
}
