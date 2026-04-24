import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type CreateMeetingResult =
  | { ok: true; meetingId: string }
  | {
      ok: false;
      error: "NO_ACTIVE_ORG" | "NO_INTERNAL_USER" | "INVALID_PERSON";
    };

export async function createMeetingForOrg(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
  },
  input: {
    organizationId: string | null;
    sellerInternalUserId: string | null;
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
  },
): Promise<CreateMeetingResult> {
  if (!input.organizationId) {
    return { ok: false, error: "NO_ACTIVE_ORG" };
  }
  if (!input.sellerInternalUserId) {
    return { ok: false, error: "NO_INTERNAL_USER" };
  }

  const personId =
    input.personId != null && String(input.personId).trim() !== ""
      ? String(input.personId).trim()
      : null;

  if (personId) {
    const person = await deps.contacts.findById({
      id: personId,
      organizationId: input.organizationId,
    });
    if (!person) {
      return { ok: false, error: "INVALID_PERSON" };
    }
  }

  const meeting = await deps.meetings.createMeeting({
    organizationId: input.organizationId,
    sellerUserId: input.sellerInternalUserId,
    personId,
    prospectName: input.prospectName.trim(),
    meetingAt: input.meetingAt,
    durationMin: input.durationMin,
    meetingType: input.meetingType,
    pipelineStage: input.pipelineStage,
    potentialAmount: input.potentialAmount,
    transcript: input.transcript.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    outcome: input.outcome,
  });

  return { ok: true, meetingId: meeting.id };
}
