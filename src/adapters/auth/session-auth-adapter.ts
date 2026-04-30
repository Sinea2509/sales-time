import { getActiveOrganizationIdFromCookies } from "@/lib/auth/session-cookie";
import { getSessionTokenFromCookies } from "@/lib/auth/session-cookie";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { SessionRepositoryPort } from "@/src/core/ports/session-repository-port";

export function makeSessionAuthAdapter(
  session: SessionRepositoryPort,
): AuthSessionPort {
  return {
    async getAuthenticatedPrincipal() {
      const raw = await getSessionTokenFromCookies();
      if (!raw) return null;
      const p = await session.findSessionPrincipal(raw);
      if (!p) return null;
      const activeOrganizationIdFromCookie =
        await getActiveOrganizationIdFromCookies();
      return { ...p, activeOrganizationIdFromCookie };
    },
  };
}
