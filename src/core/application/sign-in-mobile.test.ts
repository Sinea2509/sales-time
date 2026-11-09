import { describe, expect, it, jest } from "@jest/globals";
import type { SignInUserLookup } from "@/src/core/ports/sign-in-read-port";
import { signInMobile } from "./sign-in-mobile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

const activeUser: SignInUserLookup = {
  id: "user_1",
  passwordHash: "hash",
  status: "ACTIVE",
  isSuperAdmin: false,
  organizationMembershipCount: 1,
};

function makeDeps(
  over: Partial<{
    user: typeof activeUser | null;
    passwordOk: boolean;
  }> = {},
) {
  const deps = {
    signInRead: { findUserForPasswordSignIn: jest.fn() as JestFn },
    session: { createSessionRecord: jest.fn() as JestFn },
    verifyPassword: jest.fn() as JestFn,
    generateToken: jest.fn() as JestFn,
  };
  deps.signInRead.findUserForPasswordSignIn.mockResolvedValue(
    over.user === undefined ? activeUser : over.user,
  );
  deps.verifyPassword.mockResolvedValue(over.passwordOk ?? true);
  deps.generateToken.mockReturnValue("raw_token");
  deps.session.createSessionRecord.mockResolvedValue(undefined);
  return deps;
}

const input = {
  email: "claire@sinea.fr",
  password: "secret",
  userAgent: "SalesTimeMobile/1.0",
};

describe("signInMobile", () => {
  it("crée une session et rend son jeton", async () => {
    const deps = makeDeps();

    const result = await signInMobile(deps as never, input);

    expect(result).toEqual({
      ok: true,
      rawToken: "raw_token",
      userId: "user_1",
    });
    expect(deps.session.createSessionRecord).toHaveBeenCalledWith({
      userId: "user_1",
      rawToken: "raw_token",
      userAgent: "SalesTimeMobile/1.0",
    });
  });

  it("répond la même chose pour une adresse inconnue et un mauvais mot de passe", async () => {
    const unknown = await signInMobile(
      makeDeps({ user: null }) as never,
      input,
    );
    const wrong = await signInMobile(
      makeDeps({ passwordOk: false }) as never,
      input,
    );

    expect(unknown).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    expect(wrong).toEqual(unknown);
  });

  it("ne dit qu'un compte est désactivé qu'après un mot de passe juste", async () => {
    const disabled = { ...activeUser, status: "DISABLED" as const };

    const wrongPassword = await signInMobile(
      makeDeps({ user: disabled, passwordOk: false }) as never,
      input,
    );
    const rightPassword = await signInMobile(
      makeDeps({ user: disabled }) as never,
      input,
    );

    expect(wrongPassword).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
    expect(rightPassword).toEqual({ ok: false, error: "ACCOUNT_DISABLED" });
  });

  it("refuse un compte sans organisation sans ouvrir de session", async () => {
    const deps = makeDeps({
      user: { ...activeUser, organizationMembershipCount: 0 },
    });

    const result = await signInMobile(deps as never, input);

    expect(result).toEqual({ ok: false, error: "NO_ORG" });
    expect(deps.session.createSessionRecord).not.toHaveBeenCalled();
  });
});
