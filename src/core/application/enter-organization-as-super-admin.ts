import type { AuthSessionPort } from "../ports/auth-session-port";
import type { AuditRepositoryPort } from "../ports/audit-repository-port";
import type { OrganizationDirectoryPort } from "../ports/organization-directory-port";

export type EnterSuperAdminOrgResult =
  | { ok: true }
  | {
      ok: false;
      error: "NOT_SUPER_ADMIN" | "NOT_AUTHENTICATED" | "ORG_NOT_FOUND";
    };

export async function enterOrganizationAsSuperAdmin(
  deps: {
    auth: AuthSessionPort;
    audit: AuditRepositoryPort;
    orgDirectory: OrganizationDirectoryPort;
  },
  input: { targetOrganizationId: string; reason?: string | null },
): Promise<EnterSuperAdminOrgResult> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }

  if (!principal.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  const org = await deps.orgDirectory.getOrganizationById(
    input.targetOrganizationId,
  );
  if (!org) {
    return { ok: false, error: "ORG_NOT_FOUND" };
  }

  await deps.audit.logPlatformAction({
    actorUserId: principal.userId,
    organizationId: input.targetOrganizationId,
    action: "ENTER_ORGANIZATION",
    reason: input.reason,
  });

  return { ok: true };
}
