import type { OrganizationMembershipRole } from "./organization-membership-role";

export type WorkspaceRoleMode = "admin" | "member";

export type ResolvedAuthorization = {
  /** Tenant boundary for org-scoped operations (internal organization id). */
  activeOrganizationId: string | null;
  canManageOrganization: boolean;
  /** Settings area for tenant members; org-wide edits remain manager-only. */
  canAccessOrganizationSettings: boolean;
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
  superAdminElevatedRole: OrganizationMembershipRole | null;
  memberships: MembershipForAuth[];
  isSuperAdmin: boolean;
}): ResolvedAuthorization {
  const {
    sessionActiveOrganizationId,
    superAdminElevatedOrganizationId,
    superAdminElevatedRole,
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

  const elevatedAsManager = Boolean(
    isElevatedSuperAdmin &&
      (superAdminElevatedRole === "ADMIN" || superAdminElevatedRole === null),
  );

  const canManageOrganization = Boolean(
    activeOrganizationId &&
      (elevatedAsManager || (!isElevatedSuperAdmin && isOrgAdminForTenant)),
  );

  const canAccessOrganizationSettings = Boolean(
    activeOrganizationId && (membership !== undefined || isElevatedSuperAdmin),
  );

  return {
    activeOrganizationId,
    canManageOrganization,
    canAccessOrganizationSettings,
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
