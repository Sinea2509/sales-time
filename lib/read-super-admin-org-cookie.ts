import { cookies } from "next/headers";
import { sessionAuthAdapter } from "@/src/adapters/auth/session-auth-adapter";
import { SUPER_ADMIN_ORG_COOKIE } from "@/lib/super-admin-cookie";
import { verifySuperAdminOrgCookieValue } from "@/lib/super-admin-org-cookie-crypto";

/**
 * Returns the elevated organization id only if the cookie is present, well-formed,
 * HMAC-valid, unexpired, and bound to the current session user.
 */
export async function readSuperAdminOrgCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(SUPER_ADMIN_ORG_COOKIE)?.value;
  if (!raw) return null;

  const principal = await sessionAuthAdapter.getAuthenticatedPrincipal();
  if (!principal) return null;

  try {
    return verifySuperAdminOrgCookieValue(raw, principal.userId);
  } catch {
    return null;
  }
}
