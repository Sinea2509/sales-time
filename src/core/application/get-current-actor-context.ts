import type { ActorContext } from "../domain/actor-context";
import {
  resolveActorAuthorization,
  resolveWorkspaceRoleMode,
} from "../domain/authorization-policy";
import type { AuthSessionPort } from "../ports/auth-session-port";

function membershipRoleForOrg(
  memberships: { organizationId: string; role: string }[],
  orgId: string | null,
): "ADMIN" | "MEMBER" | null {
  if (!orgId) return null;
  const m = memberships.find((x) => x.organizationId === orgId);
  if (!m) return null;
  return m.role === "ADMIN" ? "ADMIN" : "MEMBER";
}

function resolveSessionOrganizationId(input: {
  cookieOrgId: string | null;
  memberships: { organizationId: string }[];
}): string | null {
  const { cookieOrgId, memberships } = input;
  if (
    cookieOrgId &&
    memberships.some((m) => m.organizationId === cookieOrgId)
  ) {
    return cookieOrgId;
  }
  return memberships[0]?.organizationId ?? null;
}

export async function getCurrentActorContext(
  deps: { auth: AuthSessionPort },
  params: { superAdminElevatedOrganizationId: string | null },
): Promise<ActorContext> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { kind: "guest" };
  }

  const sessionOrganizationId = resolveSessionOrganizationId({
    cookieOrgId: principal.activeOrganizationIdFromCookie,
    memberships: principal.memberships,
  });

  const {
    activeOrganizationId,
    canManageOrganization,
    isElevatedSuperAdmin,
  } = resolveActorAuthorization({
    sessionActiveOrganizationId: sessionOrganizationId,
    superAdminElevatedOrganizationId: params.superAdminElevatedOrganizationId,
    memberships: principal.memberships,
    isSuperAdmin: principal.systemRoles.includes("SUPER_ADMIN"),
  });

  const workspaceRoleMode = resolveWorkspaceRoleMode({
    activeOrganizationId,
    canManageOrganization,
  });

  return {
    kind: "authenticated",
    userId: principal.userId,
    internalUserId: principal.userId,
    email: principal.email,
    sessionOrganizationId: principal.activeOrganizationIdFromCookie,
    organizationMembershipRole: membershipRoleForOrg(
      principal.memberships,
      activeOrganizationId,
    ),
    activeOrganizationId,
    systemRoles: principal.systemRoles,
    superAdminElevatedOrganizationId: params.superAdminElevatedOrganizationId,
    canManageOrganization,
    isElevatedSuperAdmin,
    workspaceRoleMode,
    dashboardRoleMode: workspaceRoleMode,
  };
}
