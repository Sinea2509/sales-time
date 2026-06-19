import { cookies } from "next/headers";
import { getApplicationDeps } from "@/lib/application-deps";
import { SUPER_ADMIN_ORG_COOKIE } from "@/lib/super-admin-cookie";
import { verifySuperAdminOrgCookieValue } from "@/lib/super-admin-org-cookie-crypto";
import type { SuperAdminOrgElevation } from "@/src/core/domain/super-admin-org-elevation";

/**
 * Returns elevation context only if the cookie is present, well-formed,
 * HMAC-valid, unexpired, and bound to the current session user.
 */
export async function readSuperAdminOrgCookie(): Promise<SuperAdminOrgElevation | null> {
  const jar = await cookies();
  const raw = jar.get(SUPER_ADMIN_ORG_COOKIE)?.value;
  if (!raw) return null;

  const principal = await getApplicationDeps().auth.getAuthenticatedPrincipal();
  if (!principal) return null;

  try {
    return verifySuperAdminOrgCookieValue(raw, principal.userId);
  } catch {
    return null;
  }
}

/** Convenience for callers that only need the elevated organization id. */
export async function readSuperAdminOrgCookieOrganizationId(): Promise<
  string | null
> {
  const elevation = await readSuperAdminOrgCookie();
  return elevation?.organizationId ?? null;
}
