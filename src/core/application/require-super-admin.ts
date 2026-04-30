import type { AuthSessionPort } from "../ports/auth-session-port";
import type { UserRepositoryPort } from "../ports/user-repository-port";

export async function requireSuperAdminActor(deps: {
  auth: AuthSessionPort;
  users: UserRepositoryPort;
}): Promise<
  { ok: true; actorUserId: string } | { ok: false; message: string }
> {
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, message: "Non authentifié." };
  }
  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false, message: "Accès réservé aux super administrateurs." };
  }
  return { ok: true, actorUserId: principal.userId };
}
