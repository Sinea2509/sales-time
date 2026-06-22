import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

type ZodFlattenMockResult = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

// eslint-disable-next-line no-var
var zodFlattenMock: (() => ZodFlattenMockResult) | null = null;

jest.mock("zod", () => {
  const actual = jest.requireActual<typeof import("zod")>("zod");
  const origObject = actual.z.object.bind(actual.z);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- test-only Zod proxy
  function wrapSchema<T extends { safeParse: Function; refine?: Function }>(
    schema: T,
  ): T {
    const origSafeParse = schema.safeParse.bind(schema);
    schema.safeParse = (input: unknown) => {
      const result = origSafeParse(input) as {
        success: boolean;
        error?: { flatten: () => ZodFlattenMockResult };
      };
      if (!result.success && zodFlattenMock) {
        return {
          success: false as const,
          error: { flatten: () => zodFlattenMock!() },
        };
      }
      return result;
    };
    if (typeof schema.refine === "function") {
      const origRefine = schema.refine.bind(schema);
      schema.refine = (...args: Parameters<typeof origRefine>) =>
        wrapSchema(origRefine(...args));
    }
    return schema;
  }

  const zProxy = new Proxy(actual.z, {
    get(target, prop, receiver) {
      if (prop === "object") {
        return (...args: Parameters<typeof actual.z.object>) =>
          wrapSchema(origObject(...args));
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return { ...actual, z: zProxy };
});

// eslint-disable-next-line no-var
var redirectMock: JestFn;
jest.mock("next/navigation", () => {
  redirectMock = jest.fn();
  return {
    redirect: (url: string) => {
      redirectMock(url);
      throw new Error(`REDIRECT:${url}`);
    },
  };
});

// eslint-disable-next-line no-var
var hashPasswordMock: JestFn;
jest.mock("@/lib/auth/password", () => {
  hashPasswordMock = jest.fn();
  return { hashPassword: hashPasswordMock };
});

// eslint-disable-next-line no-var
var setSessionCookieMock: JestFn;
// eslint-disable-next-line no-var
var setActiveOrganizationCookieMock: JestFn;
jest.mock("@/lib/auth/session-cookie", () => {
  setSessionCookieMock = jest.fn();
  setActiveOrganizationCookieMock = jest.fn();
  return {
    setSessionCookie: setSessionCookieMock,
    setActiveOrganizationCookie: setActiveOrganizationCookieMock,
  };
});

// eslint-disable-next-line no-var
var runAcceptSuperAdminInvitationMock: JestFn;
jest.mock("@/src/core/application/accept-super-admin-invitation", () => {
  runAcceptSuperAdminInvitationMock = jest.fn();
  return { runAcceptSuperAdminInvitation: runAcceptSuperAdminInvitationMock };
});

type InvitationDepsMocks = {
  getAuthenticatedPrincipalMock: JestFn;
  findPendingByTokenForPreviewMock: JestFn;
  registerFromOrganizationInvitationMock: JestFn;
  createSessionRecordMock: JestFn;
  logPlatformActionMock: JestFn;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: InvitationDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    findPendingByTokenForPreviewMock: jest.fn(),
    registerFromOrganizationInvitationMock: jest.fn(),
    createSessionRecordMock: jest.fn(),
    logPlatformActionMock: jest.fn().mockResolvedValue(undefined),
  };
  const graph = {
    auth: { getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock },
    organizationInvitations: {
      findPendingByTokenForPreview: mocks.findPendingByTokenForPreviewMock,
    },
    registration: {
      registerFromOrganizationInvitation:
        mocks.registerFromOrganizationInvitationMock,
    },
    session: {
      createSessionRecord: mocks.createSessionRecordMock,
    },
    audit: {
      logPlatformAction: mocks.logPlatformActionMock,
    },
  };
  (graph as { __invitationTestMocks?: InvitationDepsMocks }).__invitationTestMocks =
    mocks;
  return { getApplicationDeps: () => graph };
});

const ORG_ID = "clorg00000000000000000001";

import { registerFromInvitationAction } from "@/app/[locale]/invitations/[token]/join/actions";
import { acceptSuperAdminInvitationAction } from "@/app/[locale]/super-admin-invitations/[token]/actions";
import { getApplicationDeps } from "@/lib/application-deps";

const {
  getAuthenticatedPrincipalMock,
  findPendingByTokenForPreviewMock,
  registerFromOrganizationInvitationMock,
  createSessionRecordMock,
} = (getApplicationDeps() as unknown as {
  __invitationTestMocks: InvitationDepsMocks;
}).__invitationTestMocks;

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  jest.clearAllMocks();
  zodFlattenMock = null;
  getAuthenticatedPrincipalMock.mockResolvedValue(null);
  findPendingByTokenForPreviewMock.mockResolvedValue({
    email: "invitee@test.com",
    organizationName: "Acme",
  });
});

describe("registerFromInvitationAction", () => {
  it("returns validation error when first name is empty", async () => {
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result).toEqual({
      ok: false,
      message: "Le prénom est requis",
    });
    expect(findPendingByTokenForPreviewMock).not.toHaveBeenCalled();
    expect(registerFromOrganizationInvitationMock).not.toHaveBeenCalled();
  });

  it("returns generic validation fallback on register invite", async () => {
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "short",
        confirmPassword: "short",
      }),
    );
    expect(result?.ok).toBe(false);
    expect(result?.message).toBeTruthy();
  });

  it("returns password validation fallback", async () => {
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "x",
        confirmPassword: "x",
      }),
    );
    expect(result?.ok).toBe(false);
    expect(result?.message).toBeTruthy();
  });

  it("returns validation error when last name is empty", async () => {
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.ok).toBe(false);
  });

  it("returns error when invitation preview is missing", async () => {
    findPendingByTokenForPreviewMock.mockResolvedValue(null);
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.message).toContain("invalide");
  });

  it("returns error when logged-in user matches invite email", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "invitee@test.com",
    });
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.message).toContain("déjà connecté");
  });

  it("returns error when logged-in user has different email", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "other@test.com",
    });
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.message).toContain("connecté en tant que");
  });

  it("registers from invitation and redirects to company", async () => {
    hashPasswordMock.mockResolvedValue("hash");
    registerFromOrganizationInvitationMock.mockResolvedValue({
      ok: true,
      userId: "new-user",
      organizationId: ORG_ID,
    });
    createSessionRecordMock.mockResolvedValue(undefined);
    await expect(
      registerFromInvitationAction(
        "invite-token",
        null,
        form({
          firstName: "Jane",
          lastName: "Doe",
          password: "password12",
          confirmPassword: "password12",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/company");
    expect(setSessionCookieMock).toHaveBeenCalled();
    expect(setActiveOrganizationCookieMock).toHaveBeenCalledWith(ORG_ID);
  });

  it("returns email taken error from registration", async () => {
    hashPasswordMock.mockResolvedValue("hash");
    registerFromOrganizationInvitationMock.mockResolvedValue({
      ok: false,
      error: "EMAIL_TAKEN",
    });
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.message).toContain("existe déjà");
  });

  it("returns generic invalid invite error", async () => {
    hashPasswordMock.mockResolvedValue("hash");
    registerFromOrganizationInvitationMock.mockResolvedValue({
      ok: false,
      error: "INVALID",
    });
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result?.message).toContain("invalide");
  });

  it("returns generic validation fallback when flatten has no field errors", async () => {
    zodFlattenMock = () => ({ formErrors: [], fieldErrors: {} });
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(result).toEqual({
      ok: false,
      message: "Vérifiez les champs.",
    });
  });

  it("returns validation error when passwords do not match", async () => {
    const result = await registerFromInvitationAction(
      "invite-token",
      null,
      form({
        firstName: "Jane",
        lastName: "Doe",
        password: "password12",
        confirmPassword: "other-password",
      }),
    );
    expect(result).toEqual({
      ok: false,
      message: "Les mots de passe ne correspondent pas.",
    });
    expect(findPendingByTokenForPreviewMock).not.toHaveBeenCalled();
  });
});

describe("acceptSuperAdminInvitationAction", () => {
  it("returns UNAUTHENTICATED when there is no session", async () => {
    runAcceptSuperAdminInvitationMock.mockResolvedValue({
      ok: false,
      error: "UNAUTHENTICATED",
    });
    const result = await acceptSuperAdminInvitationAction("token");
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("accepts invite and redirects to /admin", async () => {
    runAcceptSuperAdminInvitationMock.mockResolvedValue({ ok: true });
    await expect(
      acceptSuperAdminInvitationAction("super-admin-token"),
    ).rejects.toThrow("REDIRECT:/admin");
    expect(runAcceptSuperAdminInvitationMock).toHaveBeenCalledWith(
      expect.anything(),
      "super-admin-token",
    );
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("returns INVALID when invitation is not found", async () => {
    runAcceptSuperAdminInvitationMock.mockResolvedValue({
      ok: false,
      error: "INVALID",
    });
    const result = await acceptSuperAdminInvitationAction("bad-token");
    expect(result).toEqual({ ok: false, error: "INVALID" });
  });
});
