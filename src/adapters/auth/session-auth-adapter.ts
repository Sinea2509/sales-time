import { getActiveOrganizationIdFromCookies } from "@/lib/auth/session-cookie";
import { getSessionTokenFromCookies } from "@/lib/auth/session-cookie";
import { findSessionPrincipal } from "@/lib/auth/session-db";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";

export const sessionAuthAdapter: AuthSessionPort = {
  async getAuthenticatedPrincipal() {
    const raw = await getSessionTokenFromCookies();
    if (!raw) return null;
    const p = await findSessionPrincipal(raw);
    if (!p) return null;
    const activeOrganizationIdFromCookie =
      await getActiveOrganizationIdFromCookies();
    return { ...p, activeOrganizationIdFromCookie };
  },
};
