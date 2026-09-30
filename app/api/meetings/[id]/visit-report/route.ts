import { getApplicationDeps } from "@/lib/application-deps";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { writeMeetingVisitReportOnDemand } from "@/src/core/application/write-meeting-visit-report-on-demand";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const textHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
};

/**
 * Le compte rendu de visite, en texte brut, écrit à la demande s'il manque.
 *
 * Le lecteur doit appartenir à l'organisation du rendez-vous : la même règle
 * que la fiche, qui n'ouvre un rendez-vous qu'avec `activeOrganizationId`.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!meetingIdSchema.safeParse(id).success) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: await readSuperAdminOrgCookie() },
  );
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    return new Response("Non authentifié", { status: 401 });
  }

  const result = await writeMeetingVisitReportOnDemand(deps, {
    organizationId: actor.activeOrganizationId,
    meetingId: id,
    actor: {
      internalUserId: actor.internalUserId,
      canManageOrganization: actor.canManageOrganization,
    },
  });

  switch (result.kind) {
    case "text":
      return new Response(result.text, { headers: textHeaders });
    case "not_found":
      return new Response("Rendez-vous introuvable", { status: 404 });
    case "not_ready":
      return new Response("Analyse en cours", { status: 409 });
    case "unavailable":
      return new Response(result.reason, { status: 503 });
    case "failed":
      return new Response("Compte rendu indisponible", { status: 503 });
  }
}
