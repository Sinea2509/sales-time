import type { AuthSessionPort } from "../ports/auth-session-port";
import type {
  OrganizationDirectoryPort,
  OrganizationSummary,
} from "../ports/organization-directory-port";

export type ListOrgsResult =
  | { ok: true; organizations: OrganizationSummary[] }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "NOT_AUTHENTICATED" };

export async function listOrganizationsForSuperAdmin(
  deps: {
    auth: AuthSessionPort;
    orgDirectory: OrganizationDirectoryPort;
  },
  input: { limit?: number },
): Promise<ListOrgsResult> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }

  if (!principal.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  const organizations = await deps.orgDirectory.listOrganizations({
    limit: input.limit ?? 100,
  });

  return { ok: true, organizations };
}
