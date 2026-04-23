import type { SessionPrincipal } from "@/lib/auth/session-db";

export type AuthenticatedPrincipal = SessionPrincipal & {
  /** Raw `__stime_active_org` cookie value (may not match any membership). */
  activeOrganizationIdFromCookie: string | null;
};

export interface AuthSessionPort {
  /** Resolves the signed-in user from session cookie + DB, or null. */
  getAuthenticatedPrincipal(): Promise<AuthenticatedPrincipal | null>;
}
