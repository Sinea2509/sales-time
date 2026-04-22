import type { ActorContext } from "../domain/actor-context";
import { resolveActorAuthorization } from "../domain/authorization-policy";
import type { AuthSessionPort } from "../ports/auth-session-port";
import type { UserRepositoryPort } from "../ports/user-repository-port";

export async function getCurrentActorContext(
  deps: {
    auth: AuthSessionPort;
    users: UserRepositoryPort;
  },
  params: { superAdminActiveClerkOrgId: string | null },
): Promise<ActorContext> {
  const clerkUserId = await deps.auth.getClerkUserId();
  if (!clerkUserId) {
    return { kind: "guest" };
  }

  const user = await deps.users.findByClerkUserId(clerkUserId);
  const sessionClerkOrgId = await deps.auth.getClerkOrganizationId();
  const sessionClerkOrgRole = await deps.auth.getClerkOrganizationRole();
  const systemRoles = user?.systemRoles ?? [];
  const isSuperAdmin = systemRoles.includes("SUPER_ADMIN");

  const {
    activeTenantClerkOrgId,
    canManageOrganization,
    isElevatedSuperAdmin,
  } = resolveActorAuthorization({
    sessionClerkOrgId,
    sessionClerkOrgRole,
    isSuperAdmin,
    superAdminActiveClerkOrgId: params.superAdminActiveClerkOrgId,
  });

  return {
    kind: "authenticated",
    clerkUserId,
    internalUserId: user?.id ?? null,
    sessionClerkOrgId,
    sessionClerkOrgRole,
    activeTenantClerkOrgId,
    systemRoles,
    superAdminActiveClerkOrgId: params.superAdminActiveClerkOrgId,
    canManageOrganization,
    isElevatedSuperAdmin,
  };
}
