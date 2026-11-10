import { describe, expect, it, jest } from "@jest/globals";
import { makeBearerAuthAdapter } from "@/src/adapters/auth/bearer-auth-adapter";
import {
  MOBILE_ORGANIZATION_HEADER,
  readBearerToken,
  readRequestedOrganizationId,
} from "./mobile-request";

describe("readBearerToken", () => {
  it("lit le jeton d'un en-tête Bearer", () => {
    const headers = new Headers({ authorization: "Bearer abc_DEF-123" });
    expect(readBearerToken(headers)).toBe("abc_DEF-123");
  });

  it("ignore un en-tête absent, vide, d'un autre type ou démesuré", () => {
    expect(readBearerToken(new Headers())).toBeNull();
    expect(
      readBearerToken(new Headers({ authorization: "Bearer " })),
    ).toBeNull();
    expect(
      readBearerToken(new Headers({ authorization: "Basic identifiants" })),
    ).toBeNull();
    expect(
      readBearerToken(
        new Headers({ authorization: `Bearer ${"x".repeat(300)}` }),
      ),
    ).toBeNull();
  });
});

describe("readRequestedOrganizationId", () => {
  it("lit l'organisation demandée et ignore une valeur vide", () => {
    expect(
      readRequestedOrganizationId(
        new Headers({ [MOBILE_ORGANIZATION_HEADER]: "org_1" }),
      ),
    ).toBe("org_1");
    expect(
      readRequestedOrganizationId(
        new Headers({ [MOBILE_ORGANIZATION_HEADER]: "  " }),
      ),
    ).toBeNull();
  });
});

describe("makeBearerAuthAdapter", () => {
  const principal = {
    sessionId: "s1",
    userId: "u1",
    email: "claire@sinea.fr",
    firstName: "Claire",
    lastName: "Morel",
    registerProfileCompletedAt: null,
    systemRoles: [],
    memberships: [{ organizationId: "org_1", role: "MEMBER" as const }],
  };

  it("résout la session du jeton et transmet l'organisation demandée", async () => {
    const findSessionPrincipal = jest
      .fn<(raw: string) => Promise<typeof principal | null>>()
      .mockResolvedValue(principal);
    const auth = makeBearerAuthAdapter(
      { findSessionPrincipal },
      { rawToken: "raw", requestedOrganizationId: "org_1" },
    );

    await expect(auth.getAuthenticatedPrincipal()).resolves.toEqual({
      ...principal,
      activeOrganizationIdFromCookie: "org_1",
    });
    expect(findSessionPrincipal).toHaveBeenCalledWith("raw");
  });

  it("ne consulte pas la base sans jeton", async () => {
    const findSessionPrincipal = jest.fn<() => Promise<null>>();
    const auth = makeBearerAuthAdapter(
      { findSessionPrincipal },
      { rawToken: null, requestedOrganizationId: null },
    );

    await expect(auth.getAuthenticatedPrincipal()).resolves.toBeNull();
    expect(findSessionPrincipal).not.toHaveBeenCalled();
  });
});
