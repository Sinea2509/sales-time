import { getApplicationDeps } from "@/lib/application-deps";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { writePipedriveBlocksOnDemand } from "@/src/core/application/write-pipedrive-blocks-on-demand";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const noStore = { "Cache-Control": "no-store" };

/**
 * Les blocs Pipedrive d'un rendez-vous (méthode SEED), écrits à la demande.
 *
 * Même règle que la fiche : le lecteur doit appartenir à l'organisation du
 * rendez-vous, et l'organisation doit avoir la fonctionnalité.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!meetingIdSchema.safeParse(id).success) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }

  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: await readSuperAdminOrgCookie() },
  );
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const result = await writePipedriveBlocksOnDemand(deps, {
    organizationId: actor.activeOrganizationId,
    meetingId: id,
  });

  switch (result.kind) {
    case "blocks":
      return Response.json(result.blocks, { headers: noStore });
    case "not_enabled":
    case "not_found":
      return Response.json({ error: result.kind }, { status: 404 });
    case "not_ready":
      return Response.json({ error: "not_ready" }, { status: 409 });
    case "unavailable":
      return Response.json({ error: result.reason }, { status: 503 });
    case "failed":
      return Response.json({ error: "failed" }, { status: 503 });
  }
}
