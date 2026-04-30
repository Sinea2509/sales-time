import type { AuthSessionPort } from "../ports/auth-session-port";
import type { OrganizationInvitationRepositoryPort } from "../ports/organization-invitation-repository-port";

export type AcceptOrganizationInvitationOutcome =
  | { ok: true; organizationId: string }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function runAcceptOrganizationInvitation(
  deps: {
    auth: AuthSessionPort;
    organizationInvitations: OrganizationInvitationRepositoryPort;
  },
  token: string,
): Promise<AcceptOrganizationInvitationOutcome> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  const r = await deps.organizationInvitations.acceptPendingInvitation({
    tokenPlaintext: token,
    userId: principal.userId,
    userEmail: principal.email,
  });
  if (!r.ok) return r;
  return { ok: true, organizationId: r.organizationId };
}
