import type { ActorContext } from "../domain/actor-context";
import {
  resolveActorAuthorization,
  resolveWorkspaceRoleMode,
} from "../domain/authorization-policy";
import type { SuperAdminOrgElevation } from "../domain/super-admin-org-elevation";
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
  params: { superAdminElevation: SuperAdminOrgElevation | null },
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
    canAccessOrganizationSettings,
    isElevatedSuperAdmin,
  } = resolveActorAuthorization({
    sessionActiveOrganizationId: sessionOrganizationId,
    superAdminElevatedOrganizationId:
      params.superAdminElevation?.organizationId ?? null,
    superAdminElevatedRole: params.superAdminElevation?.role ?? null,
    memberships: principal.memberships,
    isSuperAdmin: principal.systemRoles.includes("SUPER_ADMIN"),
  });

  const workspaceRoleMode = resolveWorkspaceRoleMode({
    activeOrganizationId,
    canManageOrganization,
  });

  const membershipRole = membershipRoleForOrg(
    principal.memberships,
    activeOrganizationId,
  );
  const organizationMembershipRole =
    isElevatedSuperAdmin && params.superAdminElevation
      ? params.superAdminElevation.role
      : membershipRole;

  return {
    kind: "authenticated",
    userId: principal.userId,
    internalUserId: principal.userId,
    email: principal.email,
    firstName: principal.firstName,
    lastName: principal.lastName,
    sessionOrganizationId: principal.activeOrganizationIdFromCookie,
    organizationMembershipRole,
    activeOrganizationId,
    systemRoles: principal.systemRoles,
    superAdminElevatedOrganizationId:
      params.superAdminElevation?.organizationId ?? null,
    superAdminElevatedRole: params.superAdminElevation?.role ?? null,
    canManageOrganization,
    canAccessOrganizationSettings,
    isElevatedSuperAdmin,
    workspaceRoleMode,
  };
}
