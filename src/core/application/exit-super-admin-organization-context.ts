import type { AuthSessionPort } from "../ports/auth-session-port";
import type { AuditRepositoryPort } from "../ports/audit-repository-port";
import type { UserRepositoryPort } from "../ports/user-repository-port";

export type ExitSuperAdminOrgResult =
  | { ok: true }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "USER_NOT_SYNCED" };

export async function exitSuperAdminOrganizationContext(
  deps: {
    auth: AuthSessionPort;
    users: UserRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: { clerkOrgId: string; reason?: string | null },
): Promise<ExitSuperAdminOrgResult> {
  const clerkUserId = await deps.auth.getClerkUserId();
  if (!clerkUserId) {
    return { ok: false, error: "USER_NOT_SYNCED" };
  }

  const user = await deps.users.findByClerkUserId(clerkUserId);
  if (!user) {
    return { ok: false, error: "USER_NOT_SYNCED" };
  }

  if (!user.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  await deps.audit.logSuperAdminAction({
    actorInternalUserId: user.id,
    clerkOrgId: input.clerkOrgId,
    action: "EXIT_ORG",
    reason: input.reason,
  });

  return { ok: true };
}
