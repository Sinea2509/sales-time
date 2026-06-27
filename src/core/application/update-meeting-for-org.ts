import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { MeetingSourceType } from "@/src/core/domain/meeting-status";
import { resolveMeetingPersonLink } from "@/src/core/application/resolve-meeting-person-link";
import { invalidateAiSummaryCacheForOrg } from "@/src/core/application/invalidate-ai-summary-cache-for-org";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export type UpdateMeetingResult =
  | { ok: true; meetingId: string }
  | {
      ok: false;
      error: "NO_ACTIVE_ORG" | "NOT_FOUND" | "INVALID_PERSON";
    };

export async function updateMeetingForOrg(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
    aiSummaryCache: AiSummaryCacheRepositoryPort;
  },
  input: {
    organizationId: string | null;
    meetingId: string;
    personId?: string | null;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    meetingType: string | null;
    pipelineStage: string | null;
    potentialAmount: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
    feeling?: number | null;
    sourceType?: MeetingSourceType;
    sourceBlobUrl?: string | null;
  },
): Promise<UpdateMeetingResult> {
  if (!input.organizationId) {
    return { ok: false, error: "NO_ACTIVE_ORG" };
  }

  const existing = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!existing) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const explicitPersonId =
    input.personId != null && String(input.personId).trim() !== ""
      ? String(input.personId).trim()
      : null;

  if (explicitPersonId) {
    const person = await deps.contacts.findById({
      id: explicitPersonId,
      organizationId: input.organizationId,
    });
    if (!person) {
      return { ok: false, error: "INVALID_PERSON" };
    }
  }

  const resolvedPerson = await resolveMeetingPersonLink(deps.contacts, {
    organizationId: input.organizationId,
    personId: explicitPersonId,
    prospectName: input.prospectName,
  });

  if (resolvedPerson.personId && resolvedPerson.personId !== explicitPersonId) {
    const person = await deps.contacts.findById({
      id: resolvedPerson.personId,
      organizationId: input.organizationId,
    });
    if (!person) {
      return { ok: false, error: "INVALID_PERSON" };
    }
  }

  const updated = await deps.meetings.updateMeeting({
    id: input.meetingId,
    organizationId: input.organizationId,
    personId: resolvedPerson.personId,
    prospectName: resolvedPerson.prospectName,
    meetingAt: input.meetingAt,
    durationMin: input.durationMin,
    meetingType: input.meetingType,
    pipelineStage: input.pipelineStage,
    potentialAmount: input.potentialAmount,
    transcript: input.transcript.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    outcome: input.outcome,
    feeling: input.feeling ?? null,
    sourceType: input.sourceType,
    sourceBlobUrl: input.sourceBlobUrl,
  });

  if (!updated) {
    return { ok: false, error: "NOT_FOUND" };
  }

  await invalidateAiSummaryCacheForOrg(deps, input.organizationId);

  return { ok: true, meetingId: input.meetingId };
}
