import { toMobileMeeting } from "@/lib/mobile/mobile-meeting";
import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";
import { assertCanMutateMeetingForOrg } from "@/lib/meeting-mutation-access";
import { meetingIdSchema } from "@/lib/schemas/meeting";

export const dynamic = "force-dynamic";

/**
 * L'état d'un rendez-vous déposé depuis le téléphone. Le commercial ne voit
 * que les siens, le manager ceux de son organisation : la même règle que
 * pour modifier la fiche.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!meetingIdSchema.safeParse(id).success) return mobileError("VALIDATION");

  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const access = await assertCanMutateMeetingForOrg(actor.deps.meetings, {
    organizationId: actor.organizationId,
    meetingId: id,
    actorUserId: actor.actorUserId,
    canManageOrganization: actor.canManageOrganization,
  });
  if (!access.ok) return mobileError(access.error);

  return mobileJson({ meeting: toMobileMeeting(access.meeting) });
}
