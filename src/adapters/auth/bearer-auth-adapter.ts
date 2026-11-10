import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { SessionRepositoryPort } from "@/src/core/ports/session-repository-port";

/**
 * L'identité d'une requête de l'application mobile : le jeton de session
 * arrive dans l'en-tête Authorization, l'organisation choisie dans un
 * en-tête à part, là où le navigateur les porte dans deux cookies.
 *
 * L'organisation demandée n'est qu'une préférence : `getCurrentActorContext`
 * ne la retient que si l'utilisateur en est membre.
 */
export function makeBearerAuthAdapter(
  session: Pick<SessionRepositoryPort, "findSessionPrincipal">,
  input: { rawToken: string | null; requestedOrganizationId: string | null },
): AuthSessionPort {
  return {
    async getAuthenticatedPrincipal() {
      if (!input.rawToken) return null;
      const principal = await session.findSessionPrincipal(input.rawToken);
      if (!principal) return null;
      return {
        ...principal,
        activeOrganizationIdFromCookie: input.requestedOrganizationId,
      };
    },
  };
}
