import type { OrganizationMembershipRole } from "@/lib/generated/prisma/enums";

export type WorkspaceRoleMode = "admin" | "member";

/** @deprecated Prefer WorkspaceRoleMode; kept for incremental refactors. */
export type DashboardRoleMode = WorkspaceRoleMode;

export type ResolvedAuthorization = {
  /** Tenant boundary for org-scoped operations (internal organization id). */
  activeOrganizationId: string | null;
  canManageOrganization: boolean;
  isElevatedSuperAdmin: boolean;
};

export type MembershipForAuth = {
  organizationId: string;
  role: OrganizationMembershipRole;
};

/**
 * Resolves active org and admin capability. Super-admin elevation cookie wins
 * for `activeOrganizationId` when set; otherwise the session org cookie must
 * match a membership.
 */
export function resolveActorAuthorization(input: {
  sessionActiveOrganizationId: string | null;
  superAdminElevatedOrganizationId: string | null;
  memberships: MembershipForAuth[];
  isSuperAdmin: boolean;
}): ResolvedAuthorization {
  const {
    sessionActiveOrganizationId,
    superAdminElevatedOrganizationId,
    memberships,
    isSuperAdmin,
  } = input;

  const activeOrganizationId =
    isSuperAdmin && superAdminElevatedOrganizationId
      ? superAdminElevatedOrganizationId
      : sessionActiveOrganizationId;

  const isElevatedSuperAdmin = Boolean(
    isSuperAdmin &&
      superAdminElevatedOrganizationId &&
      superAdminElevatedOrganizationId === activeOrganizationId,
  );

  const membership = activeOrganizationId
    ? memberships.find((m) => m.organizationId === activeOrganizationId)
    : undefined;

  const isOrgAdminForTenant =
    membership !== undefined && membership.role === "ADMIN";

  const canManageOrganization = Boolean(
    activeOrganizationId &&
      (isElevatedSuperAdmin || isOrgAdminForTenant),
  );

  return {
    activeOrganizationId,
    canManageOrganization,
    isElevatedSuperAdmin,
  };
}

export function resolveWorkspaceRoleMode(input: {
  activeOrganizationId: string | null;
  canManageOrganization: boolean;
}): WorkspaceRoleMode | null {
  if (!input.activeOrganizationId) return null;
  return input.canManageOrganization ? "admin" : "member";
}

/** @deprecated Use resolveWorkspaceRoleMode */
export const resolveDashboardRoleMode = resolveWorkspaceRoleMode;
