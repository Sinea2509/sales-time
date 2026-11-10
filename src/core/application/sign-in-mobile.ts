import type { SessionRepositoryPort } from "@/src/core/ports/session-repository-port";
import type { SignInReadPort } from "@/src/core/ports/sign-in-read-port";

export type SignInMobileResult =
  | { ok: true; rawToken: string; userId: string }
  | { ok: false; error: "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" | "NO_ORG" };

/**
 * La connexion de l'application mobile : les mêmes identifiants et la même
 * vérification que sur le site, mais le jeton de session est rendu à
 * l'application au lieu d'être posé dans un cookie.
 *
 * Le jeton rejoint la table des sessions comme celui du navigateur : il
 * expire au même terme et se révoque de la même façon.
 *
 * Un compte sans organisation n'a rien à enregistrer depuis le téléphone ;
 * on le dit plutôt que d'ouvrir une application vide.
 */
export async function signInMobile(
  deps: {
    signInRead: SignInReadPort;
    session: Pick<SessionRepositoryPort, "createSessionRecord">;
    verifyPassword: (hash: string, password: string) => Promise<boolean>;
    generateToken: () => string;
  },
  input: { email: string; password: string; userAgent: string | null },
): Promise<SignInMobileResult> {
  const user = await deps.signInRead.findUserForPasswordSignIn(input.email);
  if (!user) return { ok: false, error: "INVALID_CREDENTIALS" };

  const passwordOk = await deps.verifyPassword(
    user.passwordHash,
    input.password,
  );
  if (!passwordOk) return { ok: false, error: "INVALID_CREDENTIALS" };

  /*
    Le statut n'est révélé qu'après un mot de passe juste, pour ne pas dire
    à un inconnu qu'une adresse a un compte.
  */
  if (user.status === "DISABLED") {
    return { ok: false, error: "ACCOUNT_DISABLED" };
  }
  if (user.organizationMembershipCount === 0) {
    return { ok: false, error: "NO_ORG" };
  }

  const rawToken = deps.generateToken();
  await deps.session.createSessionRecord({
    userId: user.id,
    rawToken,
    userAgent: input.userAgent,
  });
  return { ok: true, rawToken, userId: user.id };
}
