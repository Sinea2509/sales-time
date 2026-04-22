import type { ClerkOrgRoleSlug } from "./actor-context";

export type ResolvedAuthorization = {
  /** Tenant boundary for org-scoped operations (Clerk organization id). */
  activeTenantClerkOrgId: string | null;
  canManageOrganization: boolean;
  isElevatedSuperAdmin: boolean;
};

/**
 * Resolves which Clerk org is the active tenant and whether the actor may
 * administer it. Super admins with an elevation cookie operate as org admin
 * for that org without requiring Clerk's session `orgId` to match.
 */
export function resolveActorAuthorization(input: {
  sessionClerkOrgId: string | null;
  sessionClerkOrgRole: ClerkOrgRoleSlug;
  isSuperAdmin: boolean;
  superAdminActiveClerkOrgId: string | null;
}): ResolvedAuthorization {
  const {
    sessionClerkOrgId,
    sessionClerkOrgRole,
    isSuperAdmin,
    superAdminActiveClerkOrgId,
  } = input;

  const activeTenantClerkOrgId =
    isSuperAdmin && superAdminActiveClerkOrgId
      ? superAdminActiveClerkOrgId
      : sessionClerkOrgId;

  const isElevatedSuperAdmin = Boolean(
    isSuperAdmin &&
      superAdminActiveClerkOrgId &&
      superAdminActiveClerkOrgId === activeTenantClerkOrgId,
  );

  const sessionMatchesTenant =
    Boolean(sessionClerkOrgId) &&
    sessionClerkOrgId === activeTenantClerkOrgId;

  const isClerkOrgAdminForTenant =
    sessionMatchesTenant && sessionClerkOrgRole === "org:admin";

  const canManageOrganization = Boolean(
    activeTenantClerkOrgId &&
      (isElevatedSuperAdmin || isClerkOrgAdminForTenant),
  );

  return {
    activeTenantClerkOrgId,
    canManageOrganization,
    isElevatedSuperAdmin,
  };
}
