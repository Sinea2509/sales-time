import { toMobileMeeting } from "@/lib/mobile/mobile-meeting";
import { requireMobileMeeting } from "@/lib/mobile/mobile-meeting-access";
import { mobileJson } from "@/lib/mobile/mobile-request";
import { mobileDebrief } from "@/src/core/domain/mobile-debrief";
import { hasOrganizationFeature } from "@/src/core/domain/organization-features";

export const dynamic = "force-dynamic";

/**
 * Un rendez-vous et ce qu'il appelle juste après : la note, les défis, le
 * mail de suivi et le compte rendu, tels qu'ils sont sur la fiche.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireMobileMeeting(request, id);
  if (!access.ok) return access.response;
  const { actor, meeting } = access;

  const debrief = mobileDebrief(meeting);
  const features = await actor.deps.organizationFeatures.listEnabledFeatures(
    actor.organizationId,
  );

  return mobileJson({
    meeting: toMobileMeeting({ ...meeting, salesScore: debrief.salesScore }),
    debrief,
    pipedriveEnabled: hasOrganizationFeature(
      actor.organizationId,
      features,
      "pipedrive_blocks",
    ),
  });
}
