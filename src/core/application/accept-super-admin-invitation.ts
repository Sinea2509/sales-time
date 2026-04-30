import type { AuthSessionPort } from "../ports/auth-session-port";
import type { SuperAdminInvitationRepositoryPort } from "../ports/super-admin-invitation-repository-port";

export type AcceptSuperAdminInvitationOutcome =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function runAcceptSuperAdminInvitation(
  deps: {
    auth: AuthSessionPort;
    superAdminInvitations: SuperAdminInvitationRepositoryPort;
  },
  token: string,
): Promise<AcceptSuperAdminInvitationOutcome> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  return deps.superAdminInvitations.acceptPendingInvitation({
    tokenPlaintext: token,
    userId: principal.userId,
    userEmail: principal.email,
  });
}
