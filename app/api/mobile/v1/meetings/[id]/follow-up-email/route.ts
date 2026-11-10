import { revalidatePath } from "next/cache";
import { checkAiGatewayConfigured } from "@/lib/env";
import { requireMobileMeeting } from "@/lib/mobile/mobile-meeting-access";
import { mobileError, mobileJson } from "@/lib/mobile/mobile-request";
import { writeFollowUpEmail } from "@/lib/write-follow-up-email";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Écrit le mail de suivi depuis le téléphone. Il s'enregistre sur la fiche,
 * comme quand le commercial l'écrit depuis le site.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireMobileMeeting(request, id);
  if (!access.ok) return access.response;
  const { actor, meeting } = access;

  if (meeting.status !== "READY") return mobileError("NOT_READY");
  const ai = checkAiGatewayConfigured();
  if (!ai.ok) return mobileError(ai.error);

  try {
    const { subject, body } = await writeFollowUpEmail(actor.deps, {
      organizationId: actor.organizationId,
      meeting,
    });
    revalidatePath(`/company/rendez-vous/${id}`);
    return mobileJson({ subject, body });
  } catch {
    return mobileError("FAILED");
  }
}
