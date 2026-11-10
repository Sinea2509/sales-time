import { requireMobileMeeting } from "@/lib/mobile/mobile-meeting-access";
import { mobileError, mobileJson } from "@/lib/mobile/mobile-request";
import { writeMeetingVisitReportOnDemand } from "@/src/core/application/write-meeting-visit-report-on-demand";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Le compte rendu de visite, écrit à la demande s'il manque encore. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireMobileMeeting(request, id);
  if (!access.ok) return access.response;
  const { actor } = access;

  const result = await writeMeetingVisitReportOnDemand(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: id,
    actor: {
      internalUserId: actor.internalUserId,
      canManageOrganization: actor.canManageOrganization,
    },
  });

  switch (result.kind) {
    case "text":
      return mobileJson({ text: result.text });
    case "not_found":
      return mobileError("NOT_FOUND");
    case "not_ready":
      return mobileError("NOT_READY");
    case "unavailable":
      return mobileError(result.reason);
    case "failed":
      return mobileError("FAILED");
  }
}
