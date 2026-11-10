import { requireMobileMeeting } from "@/lib/mobile/mobile-meeting-access";
import { mobileError, mobileJson } from "@/lib/mobile/mobile-request";
import { writePipedriveBlocksOnDemand } from "@/src/core/application/write-pipedrive-blocks-on-demand";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Les blocs à coller dans Pipedrive (méthode SEED), pour les organisations
 * qui ont la fonctionnalité.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await requireMobileMeeting(request, id);
  if (!access.ok) return access.response;
  const { actor } = access;

  const result = await writePipedriveBlocksOnDemand(actor.deps, {
    organizationId: actor.organizationId,
    meetingId: id,
  });

  switch (result.kind) {
    case "blocks":
      return mobileJson({ blocks: result.blocks });
    case "not_enabled":
      return mobileError("FORBIDDEN");
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
