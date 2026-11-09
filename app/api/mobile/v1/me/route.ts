import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";

export const dynamic = "force-dynamic";

/**
 * Qui est connecté sur le téléphone, et pour quelle organisation : de quoi
 * afficher l'écran d'accueil et proposer de changer d'organisation.
 */
export async function GET(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const principal = await actor.deps.session.findSessionPrincipal(
    actor.rawToken,
  );
  if (!principal) return mobileError("UNAUTHENTICATED");

  const organizations = (
    await Promise.all(
      principal.memberships.map((m) =>
        actor.deps.orgDirectory.getOrganizationById(m.organizationId),
      ),
    )
  )
    .filter((o) => o !== null)
    .map((o) => ({ id: o.id, name: o.name }));

  return mobileJson({
    user: {
      id: principal.userId,
      email: principal.email,
      firstName: principal.firstName,
      lastName: principal.lastName,
    },
    activeOrganizationId: actor.organizationId,
    organizations,
  });
}
