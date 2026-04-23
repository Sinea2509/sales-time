import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type CreateMeetingResult =
  | { ok: true; meetingId: string }
  | { ok: false; error: "NO_ACTIVE_ORG" | "NO_INTERNAL_USER" };

export async function createMeetingForOrg(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string | null;
    sellerInternalUserId: string | null;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
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

  const meeting = await deps.meetings.createMeeting({
    organizationId: input.organizationId,
    sellerUserId: input.sellerInternalUserId,
    prospectName: input.prospectName.trim(),
    meetingAt: input.meetingAt,
    durationMin: input.durationMin,
    transcript: input.transcript.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    outcome: input.outcome,
  });

  return { ok: true, meetingId: meeting.id };
}
