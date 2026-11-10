import { assertCanMutateMeetingForOrg } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import {
  mobileError,
  requireMobileOrgActor,
  type MobileActor,
} from "./mobile-request";

export type MobileMeetingAccess =
  | { ok: true; actor: MobileActor; meeting: MeetingDetailWithAnalyses }
  | { ok: false; response: Response };

/**
 * Un rendez-vous ouvert depuis le téléphone : le commercial ne lit que les
 * siens, le manager ceux de son organisation, comme pour modifier la fiche.
 * La grille, le coaching et le mail ne regardent qu'eux.
 */
export async function requireMobileMeeting(
  request: Request,
  rawId: string,
): Promise<MobileMeetingAccess> {
  if (!meetingIdSchema.safeParse(rawId).success) {
    return { ok: false, response: mobileError("VALIDATION") };
  }
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return { ok: false, response: mobileError(actor.error) };

  const access = await assertCanMutateMeetingForOrg(actor.deps.meetings, {
    organizationId: actor.organizationId,
    meetingId: rawId,
    actorUserId: actor.actorUserId,
    canManageOrganization: actor.canManageOrganization,
  });
  if (!access.ok) return { ok: false, response: mobileError(access.error) };

  const meeting = await actor.deps.meetings.findMeetingDetailWithAnalyses({
    id: rawId,
    organizationId: actor.organizationId,
  });
  if (!meeting) return { ok: false, response: mobileError("NOT_FOUND") };

  return { ok: true, actor, meeting };
}
