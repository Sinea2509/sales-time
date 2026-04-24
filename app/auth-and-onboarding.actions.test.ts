import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";

const redirectMock = vi.fn<(url: string) => never>();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    const err = new Error(`REDIRECT:${url}`);
    throw err;
  },
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
  },
  onboardingProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  passwordResetToken: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  organizationInvitation: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  organizationMembership: {
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const hashPasswordMock = vi.hoisted(() => vi.fn());
const verifyPasswordMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/password", () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock,
}));

const createSessionRecordMock = vi.hoisted(() => vi.fn());
const setSessionCookieMock = vi.hoisted(() => vi.fn());
const setActiveOrganizationCookieMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/session-db", () => ({
  createSessionRecord: createSessionRecordMock,
}));
vi.mock("@/lib/auth/session-cookie", () => ({
  setSessionCookie: setSessionCookieMock,
  setActiveOrganizationCookie: setActiveOrganizationCookieMock,
}));

const sendTransactionalEmailMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email/mailer", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

const getAuthenticatedPrincipalMock = vi.hoisted(() => vi.fn());
const findByIdMock = vi.hoisted(() => vi.fn());
const findRegisterGateByUserIdMock = vi.hoisted(() => vi.fn());
const completeRegisterProfileRepoMock = vi.hoisted(() => vi.fn());
const updateAfterStep1Mock = vi.hoisted(() => vi.fn());
const updateAfterStep2Mock = vi.hoisted(() => vi.fn());
const updateAfterStep3Mock = vi.hoisted(() => vi.fn());

vi.mock("@/src/adapters/composition", () => ({
  makeApplicationDeps: () => ({
    auth: {
      getAuthenticatedPrincipal: getAuthenticatedPrincipalMock,
    },
    users: {
      findById: findByIdMock,
      findRegisterGateByUserId: findRegisterGateByUserIdMock,
      completeRegisterProfile: completeRegisterProfileRepoMock,
    },
    onboardingProfiles: {
      updateAfterStep1: updateAfterStep1Mock,
      updateAfterStep2: updateAfterStep2Mock,
      updateAfterStep3: updateAfterStep3Mock,
    },
  }),
}));

import { signUpAction } from "@/app/[locale]/sign-up/actions";
import { signInAction } from "@/app/[locale]/sign-in/actions";
import { forgotPasswordAction } from "@/app/[locale]/forgot-password/actions";
import { resetPasswordAction } from "@/app/[locale]/reset-password/actions";
import { acceptOrganizationInvitationAction } from "@/app/[locale]/invitations/[token]/actions";
import { completeRegisterProfile } from "@/app/[locale]/register/profile/actions";
import {
  submitOnboardingStep1,
  submitOnboardingStep2,
  submitOnboardingStep3,
  submitOnboardingStep4,
} from "@/app/[locale]/onboarding/actions";
import { hashToken } from "@/lib/auth/tokens";

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.organizationInvitation.update.mockReset();
  prismaMock.organizationInvitation.update.mockResolvedValue({});
  prismaMock.organizationMembership.upsert.mockReset();
  prismaMock.organizationMembership.upsert.mockResolvedValue({});
  prismaMock.user.update.mockReset();
  prismaMock.user.update.mockResolvedValue({});
  prismaMock.passwordResetToken.updateMany.mockReset();
  prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.$transaction.mockReset();
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) {
      await Promise.all(arg);
      return;
    }
    if (typeof arg === "function") {
      return arg(prismaMock);
    }
    return undefined;
  });
});

describe("signUpAction", () => {
  it("returns validation error for invalid email", async () => {
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "nope",
        website: "https://example.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toMatch(/e-mail|email|champs/i);
  });

  it("returns error when passwords do not match", async () => {
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "a@b.co",
        website: "https://example.com",
        password: "password12",
        confirmPassword: "other",
      }),
    );
    expect(r).toEqual({
      ok: false,
      message: "Les mots de passe ne correspondent pas.",
    });
  });

  it("returns error for invalid website", async () => {
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "a@b.co",
        website: "@@@",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toContain("invalide");
  });

  it("returns error when organization already exists for hostname", async () => {
    prismaMock.organization.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if ("websiteNormalized" in where) {
          return { id: "org1" } as never;
        }
        return null;
      },
    );
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "new@b.co",
        website: "https://acme.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toContain("déjà enregistrée");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns error when email is already registered", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" } as never);
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "exists@b.co",
        website: "https://newco.io",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r).toEqual({
      ok: false,
      message: "Un compte existe déjà avec cet e-mail.",
    });
  });

  it("creates user, session, and redirects to register profile", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      email: "hi@b.co",
    } as never);
    hashPasswordMock.mockResolvedValue("hash");
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signUpAction(
        null,
        form({
          firstName: "Jane",
          lastName: "Doe",
          email: "Hi@B.co",
          website: "WWW.Example.COM/path",
          password: "password12",
          confirmPassword: "password12",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/register/profile");

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: "hi@b.co",
        passwordHash: "hash",
        signupWebsiteNormalized: "example.com",
        firstName: "Jane",
        lastName: "Doe",
      },
    });
    expect(createSessionRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-new" }),
    );
    expect(setSessionCookieMock).toHaveBeenCalled();
  });
});

describe("signInAction", () => {
  it("returns generic error for invalid payload", async () => {
    const r = await signInAction(
      null,
      form({ email: "bad", password: "x", next: "" }),
    );
    expect(r).toEqual({ ok: false, message: "E-mail ou mot de passe invalide." });
  });

  it("returns error when user is unknown", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const r = await signInAction(
      null,
      form({ email: "no@one.co", password: "password12" }),
    );
    expect(r?.message).toBe("E-mail ou mot de passe incorrect.");
  });

  it("returns error when password is wrong", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
    } as never);
    verifyPasswordMock.mockResolvedValue(false);
    const r = await signInAction(
      null,
      form({ email: "a@b.co", password: "wrong" }),
    );
    expect(r?.message).toBe("E-mail ou mot de passe incorrect.");
  });

  it("redirects to /company on success", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
    } as never);
    verifyPasswordMock.mockResolvedValue(true);
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signInAction(null, form({ email: "a@b.co", password: "password12" })),
    ).rejects.toThrow("REDIRECT:/company");
  });

  it("redirects to safe relative next when provided", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
    } as never);
    verifyPasswordMock.mockResolvedValue(true);
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signInAction(
        null,
        form({
          email: "a@b.co",
          password: "password12",
          next: "/onboarding",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("ignores open-redirect style next and uses /company", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
    } as never);
    verifyPasswordMock.mockResolvedValue(true);
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signInAction(
        null,
        form({
          email: "a@b.co",
          password: "password12",
          next: "//evil.com",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/company");
  });
});

describe("forgotPasswordAction", () => {
  it("returns error for invalid email", async () => {
    const r = await forgotPasswordAction(null, form({ email: "nope" }));
    expect(r).toEqual({ ok: false, message: "E-mail invalide." });
  });

  it("returns ok without leaking when user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const r = await forgotPasswordAction(null, form({ email: "ghost@b.co" }));
    expect(r).toEqual({ ok: true });
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
  });

  it("creates reset token and sends email when user exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "me@b.co",
    } as never);
    prismaMock.passwordResetToken.create.mockResolvedValue({} as never);
    sendTransactionalEmailMock.mockResolvedValue(undefined);

    const r = await forgotPasswordAction(null, form({ email: "Me@B.co" }));
    expect(r).toEqual({ ok: true });
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "me@b.co",
        subject: expect.stringContaining("Réinitialiser"),
      }),
    );
  });
});

describe("resetPasswordAction", () => {
  it("returns validation error for short password", async () => {
    const r = await resetPasswordAction(
      null,
      form({
        token: "x".repeat(12),
        password: "short",
        confirm: "short",
      }),
    );
    expect(r?.ok).toBe(false);
  });

  it("returns error when token row is missing or expired", async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);
    const r = await resetPasswordAction(
      null,
      form({
        token: "good-length-token-here-abc",
        password: "password12",
        confirm: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toContain("invalide");
  });

  it("updates password and redirects to sign-in", async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue({
      id: "t1",
      userId: "u1",
    } as never);
    hashPasswordMock.mockResolvedValue("newhash");
    prismaMock.$transaction.mockImplementationOnce(async (ops: unknown) => {
      const arr = ops as Promise<unknown>[];
      await Promise.all(arr);
    });

    const raw = "reset-raw-token-value-ok";
    await expect(
      resetPasswordAction(
        null,
        form({
          token: raw,
          password: "password12",
          confirm: "password12",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/sign-in");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { passwordHash: "newhash" },
    });
  });
});

describe("acceptOrganizationInvitationAction", () => {
  it("returns UNAUTHENTICATED when there is no session", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const r = await acceptOrganizationInvitationAction("any");
    expect(r).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("returns INVALID when invitation is not found", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "inv@b.co",
    });
    prismaMock.organizationInvitation.findFirst.mockResolvedValue(null);
    const r = await acceptOrganizationInvitationAction("tok");
    expect(r).toEqual({ ok: false, error: "INVALID" });
  });

  it("returns EMAIL_MISMATCH when logged-in email does not match invite", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "other@b.co",
    });
    prismaMock.organizationInvitation.findFirst.mockResolvedValue({
      id: "i1",
      organizationId: "o1",
      email: "inv@b.co",
      role: "MEMBER",
    } as never);

    const r = await acceptOrganizationInvitationAction("raw");
    expect(r).toEqual({ ok: false, error: "EMAIL_MISMATCH" });
  });

  it("accepts invite, sets active org, redirects to /company", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "Inv@B.co",
    });
    prismaMock.organizationInvitation.findFirst.mockResolvedValue({
      id: "i1",
      organizationId: "o1",
      email: "inv@b.co",
      role: "MEMBER",
    } as never);
    setActiveOrganizationCookieMock.mockResolvedValue(undefined);

    const raw = "invite-secret-token";
    await expect(
      acceptOrganizationInvitationAction(raw),
    ).rejects.toThrow("REDIRECT:/company");

    expect(prismaMock.organizationInvitation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tokenHash: hashToken(raw),
          status: "PENDING",
        }),
      }),
    );
    expect(setActiveOrganizationCookieMock).toHaveBeenCalledWith("o1");
  });
});

describe("completeRegisterProfile", () => {
  it("returns error when not authenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const r = await completeRegisterProfile(
      undefined,
      form({
        firstName: "A",
        lastName: "B",
        profileRole: "COMMERCIAL",
      }),
    );
    expect(r).toEqual({ ok: false, message: "Session expirée." });
  });

  it("returns validation error for empty first name", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: "u1" });
    const r = await completeRegisterProfile(
      undefined,
      form({
        firstName: "",
        lastName: "B",
        profileRole: "COMMERCIAL",
      }),
    );
    expect(r?.ok).toBe(false);
  });

  it("returns error when user row is missing", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: "u1" });
    findRegisterGateByUserIdMock.mockResolvedValue(null);
    const r = await completeRegisterProfile(
      undefined,
      form({
        firstName: "A",
        lastName: "B",
        profileRole: "COMMERCIAL",
      }),
    );
    expect(r).toEqual({ ok: false, message: "Utilisateur introuvable." });
  });

  it("redirects to onboarding when profile was already completed", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: "u1" });
    findRegisterGateByUserIdMock.mockResolvedValue({
      id: "u1",
      firstName: null,
      lastName: null,
      registerProfileCompletedAt: new Date(),
      onboardingProfile: null,
    });

    await expect(
      completeRegisterProfile(
        undefined,
        form({
          firstName: "A",
          lastName: "B",
          profileRole: "COMMERCIAL",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/onboarding");

    expect(completeRegisterProfileRepoMock).not.toHaveBeenCalled();
  });

  it("persists profile and redirects to onboarding", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: "u1" });
    findRegisterGateByUserIdMock.mockResolvedValue({
      id: "u1",
      firstName: null,
      lastName: null,
      registerProfileCompletedAt: null,
      onboardingProfile: null,
    });
    completeRegisterProfileRepoMock.mockResolvedValue(undefined);

    await expect(
      completeRegisterProfile(
        undefined,
        form({
          firstName: "Jane",
          lastName: "Doe",
          profileRole: "LEADERSHIP",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/onboarding");

    expect(completeRegisterProfileRepoMock).toHaveBeenCalledWith({
      userId: "u1",
      firstName: "Jane",
      lastName: "Doe",
      profileRole: "LEADERSHIP",
    });
  });
});

describe("onboarding steps", () => {
  const domainUser = {
    id: "u1",
    email: "a@b.co",
    systemRoles: [] as const,
  };

  beforeEach(() => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: "u1",
      email: "a@b.co",
    });
    findByIdMock.mockResolvedValue(domainUser);
  });

  it("submitOnboardingStep1 returns field errors when company name empty", async () => {
    const r = await submitOnboardingStep1({ companyName: "" });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.fieldErrors?.companyName).toBeTruthy();
  });

  it("submitOnboardingStep1 persists via repository", async () => {
    updateAfterStep1Mock.mockResolvedValue(undefined);
    const r = await submitOnboardingStep1({
      companyName: "Acme SAS",
      industrySector: "IT",
    });
    expect(r).toEqual({ ok: true });
    expect(updateAfterStep1Mock).toHaveBeenCalledWith("u1", {
      companyName: "Acme SAS",
      industrySector: "IT",
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
    });
  });

  it("submitOnboardingStep2 persists objections and arguments", async () => {
    updateAfterStep2Mock.mockResolvedValue(undefined);
    const r = await submitOnboardingStep2({
      objections: ["Prix"],
      keyArguments: ["ROI"],
    });
    expect(r).toEqual({ ok: true });
    expect(updateAfterStep2Mock).toHaveBeenCalled();
  });

  it("submitOnboardingStep3 fails when meeting types empty", async () => {
    const r = await submitOnboardingStep3({
      meetingTypes: [],
      pipelineStages: ["A"],
    });
    expect(r.ok).toBe(false);
  });

  it("submitOnboardingStep3 persists when valid", async () => {
    updateAfterStep3Mock.mockResolvedValue(undefined);
    const r = await submitOnboardingStep3({
      meetingTypes: ["Découverte"],
      pipelineStages: ["Qualif"],
    });
    expect(r).toEqual({ ok: true });
    expect(updateAfterStep3Mock).toHaveBeenCalledWith("u1", {
      meetingTypes: ["Découverte"],
      pipelineStages: ["Qualif"],
    });
  });

  it("submitOnboardingStep4 fails when step1 company name missing", async () => {
    prismaMock.onboardingProfile.findUnique.mockResolvedValue({
      companyName: null,
    } as never);
    const r = await submitOnboardingStep4({ invites: [] });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain("étape entreprise");
  });

  it("submitOnboardingStep4 fails when website key already has an org", async () => {
    prismaMock.onboardingProfile.findUnique.mockResolvedValue({
      companyName: "Acme",
      industrySector: null,
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
      companyPitch: null,
      objections: [],
      keyArguments: [],
      industryVocabulary: null,
      meetingTypes: ["m"],
      pipelineStages: ["p"],
    } as never);
    prismaMock.user.findUnique.mockResolvedValue({
      signupWebsiteNormalized: "acme.com",
    } as never);
    prismaMock.organization.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if (
          "websiteNormalized" in where &&
          where.websiteNormalized === "acme.com"
        ) {
          return { id: "taken" } as never;
        }
        return null;
      },
    );

    const r = await submitOnboardingStep4({ invites: [] });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain("site web");
  });

  it("submitOnboardingStep4 creates org and redirects to /company", async () => {
    prismaMock.onboardingProfile.findUnique.mockResolvedValue({
      companyName: "Ma Société",
      industrySector: null,
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
      companyPitch: null,
      objections: [],
      keyArguments: [],
      industryVocabulary: null,
      meetingTypes: ["m"],
      pipelineStages: ["p"],
    } as never);
    prismaMock.user.findUnique.mockResolvedValue({
      signupWebsiteNormalized: "masociete.fr",
    } as never);
    prismaMock.organization.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if ("websiteNormalized" in where) {
          return null;
        }
        return null;
      },
    );

    prismaMock.$transaction.mockImplementationOnce(
      async (fn: (tx: Record<string, unknown>) => Promise<string>) => {
        const tx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: "org-1" }),
          },
          organizationMembership: {
            create: vi.fn().mockResolvedValue({}),
          },
          organizationSettings: {
            create: vi.fn().mockResolvedValue({}),
          },
          organizationInvitation: {
            create: vi.fn().mockResolvedValue({}),
          },
          onboardingProfile: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx as never);
      },
    );
    setActiveOrganizationCookieMock.mockResolvedValue(undefined);
    sendTransactionalEmailMock.mockResolvedValue(undefined);

    await expect(
      submitOnboardingStep4({
        invites: [{ email: "peer@b.co", role: "MEMBER" }],
      }),
    ).rejects.toThrow("REDIRECT:/company");

    expect(setActiveOrganizationCookieMock).toHaveBeenCalledWith("org-1");
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
  });

  it("submitOnboardingStep4 maps P2002 to friendly message", async () => {
    prismaMock.onboardingProfile.findUnique.mockResolvedValue({
      companyName: "Dup",
      industrySector: null,
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
      companyPitch: null,
      objections: [],
      keyArguments: [],
      industryVocabulary: null,
      meetingTypes: ["m"],
      pipelineStages: ["p"],
    } as never);
    prismaMock.user.findUnique.mockResolvedValue({
      signupWebsiteNormalized: "dup.com",
    } as never);
    prismaMock.organization.findUnique.mockResolvedValue(null);

    prismaMock.$transaction.mockImplementationOnce(async () => {
      throw new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      });
    });

    const r = await submitOnboardingStep4({ invites: [] });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain("site web");
  });
});

describe("submitOnboardingStep1 when session missing", () => {
  it("redirects to sign-in", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(
      submitOnboardingStep1({ companyName: "X" }),
    ).rejects.toThrow("REDIRECT:/sign-in");
  });
});
