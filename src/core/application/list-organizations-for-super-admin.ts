import type { AuthSessionPort } from "../ports/auth-session-port";
import type {
  OrganizationDirectoryPort,
  OrganizationSummary,
} from "../ports/organization-directory-port";
import type { UserRepositoryPort } from "../ports/user-repository-port";

export type ListOrgsResult =
  | { ok: true; organizations: OrganizationSummary[] }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "USER_NOT_SYNCED" };

export async function listOrganizationsForSuperAdmin(
  deps: {
    auth: AuthSessionPort;
    users: UserRepositoryPort;
    orgDirectory: OrganizationDirectoryPort;
  },
  input: { limit?: number },
): Promise<ListOrgsResult> {
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

  const organizations = await deps.orgDirectory.listOrganizations({
    limit: input.limit ?? 100,
  });

  return { ok: true, organizations };
}
