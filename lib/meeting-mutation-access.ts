import type { OrgActorSuccess } from "@/lib/analysis-server-context";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/** Org-scoped meeting access for mutations (prevents IDOR). */
export async function assertCanMutateMeetingForOrg(
  meetings: MeetingRepositoryPort,
  input: {
    organizationId: string;
    meetingId: string;
    actorUserId: string;
    canManageOrganization: boolean;
  },
): Promise<
  | {
      ok: true;
      meeting: NonNullable<
        Awaited<ReturnType<MeetingRepositoryPort["findMeetingByIdForOrg"]>>
      >;
    }
  | { ok: false; error: "NOT_FOUND" | "FORBIDDEN" }
> {
  const meeting = await meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (
    !input.canManageOrganization &&
    meeting.sellerUserId !== input.actorUserId
  ) {
    return { ok: false, error: "FORBIDDEN" };
  }

  return { ok: true, meeting };
}

export async function requireMeetingMutationAccess(
  meetings: MeetingRepositoryPort,
  actor: OrgActorSuccess,
  meetingId: string,
): Promise<
  | {
      ok: true;
      meeting: NonNullable<
        Awaited<ReturnType<MeetingRepositoryPort["findMeetingByIdForOrg"]>>
      >;
    }
  | { ok: false; error: "NOT_FOUND" | "FORBIDDEN" }
> {
  return assertCanMutateMeetingForOrg(meetings, {
    organizationId: actor.organizationId,
    meetingId,
    actorUserId: actor.actorUserId,
    canManageOrganization: actor.canManageOrganization,
  });
}
