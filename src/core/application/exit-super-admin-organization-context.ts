import type { AuthSessionPort } from "../ports/auth-session-port";
import type { AuditRepositoryPort } from "../ports/audit-repository-port";

export type ExitSuperAdminOrgResult =
  | { ok: true }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "NOT_AUTHENTICATED" };

export async function exitSuperAdminOrganizationContext(
  deps: {
    auth: AuthSessionPort;
    audit: AuditRepositoryPort;
  },
  input: { organizationId: string; reason?: string | null },
): Promise<ExitSuperAdminOrgResult> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }

  if (!principal.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  await deps.audit.logSuperAdminAction({
    actorInternalUserId: principal.userId,
    organizationId: input.organizationId,
    action: "EXIT_ORG",
    reason: input.reason,
  });

  return { ok: true };
}
