import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";

// eslint-disable-next-line no-var
var redirectMock: jest.Mock;
jest.mock("next/navigation", () => {
  redirectMock = jest.fn();
  return {
    redirect: (url: string) => {
      redirectMock(url);
      const err = new Error(`REDIRECT:${url}`);
      throw err;
    },
  };
});

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    onboardingProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    organizationInvitation: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    organizationMembership: {
      upsert: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// eslint-disable-next-line no-var
var hashPasswordMock: jest.Mock;
// eslint-disable-next-line no-var
var verifyPasswordMock: jest.Mock;
jest.mock("@/lib/auth/password", () => {
  hashPasswordMock = jest.fn();
  verifyPasswordMock = jest.fn();
  return {
    hashPassword: hashPasswordMock,
    verifyPassword: verifyPasswordMock,
  };
});

// eslint-disable-next-line no-var
var createSessionRecordMock: jest.Mock;
// eslint-disable-next-line no-var
var setSessionCookieMock: jest.Mock;
// eslint-disable-next-line no-var
var setActiveOrganizationCookieMock: jest.Mock;
jest.mock("@/lib/auth/session-cookie", () => {
  createSessionRecordMock = jest.fn();
  setSessionCookieMock = jest.fn();
  setActiveOrganizationCookieMock = jest.fn();
  return {
    setSessionCookie: setSessionCookieMock,
    setActiveOrganizationCookie: setActiveOrganizationCookieMock,
  };
});

// eslint-disable-next-line no-var
var sendTransactionalEmailMock: jest.Mock;
jest.mock("@/lib/email/mailer", () => {
  sendTransactionalEmailMock = jest.fn();
  return { sendTransactionalEmail: sendTransactionalEmailMock };
});

// eslint-disable-next-line no-var
var getAuthenticatedPrincipalMock: jest.Mock;
// eslint-disable-next-line no-var
var findByIdMock: jest.Mock;
// eslint-disable-next-line no-var
var findRegisterGateByUserIdMock: jest.Mock;
// eslint-disable-next-line no-var
var completeRegisterProfileRepoMock: jest.Mock;
// eslint-disable-next-line no-var
var updateAfterStep1Mock: jest.Mock;
// eslint-disable-next-line no-var
var updateAfterStep2Mock: jest.Mock;
// eslint-disable-next-line no-var
var updateAfterStep3Mock: jest.Mock;
// eslint-disable-next-line no-var
var findUserWithOnboardingByUserIdMock: jest.Mock;
// eslint-disable-next-line no-var
var registrationRegisterNewUserMock: jest.Mock;
// eslint-disable-next-line no-var
var signInFindUserMock: jest.Mock;
// eslint-disable-next-line no-var
var passwordResetFindUserMock: jest.Mock;
// eslint-disable-next-line no-var
var passwordResetCreateTokenMock: jest.Mock;
// eslint-disable-next-line no-var
var passwordResetConsumeMock: jest.Mock;
// eslint-disable-next-line no-var
var organizationInvitationsAcceptMock: jest.Mock;
// eslint-disable-next-line no-var
var onboardingCompletionStep4Mock: jest.Mock;

jest.mock("@/lib/application-deps", () => {
  getAuthenticatedPrincipalMock = jest.fn();
  findByIdMock = jest.fn();
  findRegisterGateByUserIdMock = jest.fn();
  completeRegisterProfileRepoMock = jest.fn();
  updateAfterStep1Mock = jest.fn();
  updateAfterStep2Mock = jest.fn();
  updateAfterStep3Mock = jest.fn();
  findUserWithOnboardingByUserIdMock = jest.fn();
  registrationRegisterNewUserMock = jest.fn(
    async (input: {
      email: string;
      firstName: string;
      lastName: string;
      companyName: string;
      profileRole: string;
      passwordHash: string;
      signupWebsiteNormalized: string;
    }) => {
      const { prisma: prismaMock } = await import("@/lib/prisma");
      const { emailDomainMatchesOrgWebsite } = await import(
        "@/src/core/domain/email-domain-matches-org-website"
      );
      const existing = await prismaMock.user.findUnique({
        where: { email: input.email },
      });
      if (existing)
        return { ok: false as const, error: "EMAIL_TAKEN" as const };
      if (
        !emailDomainMatchesOrgWebsite(
          input.email,
          input.signupWebsiteNormalized,
        )
      ) {
        return { ok: false as const, error: "EMAIL_DOMAIN_MISMATCH" as const };
      }
      const existingOrg = await prismaMock.organization.findUnique({
        where: { websiteNormalized: input.signupWebsiteNormalized },
      });
      if (existingOrg) {
        const user = await prismaMock.user.create({
          data: {
            email: input.email,
            passwordHash: input.passwordHash,
            signupWebsiteNormalized: null,
            firstName: input.firstName,
            lastName: input.lastName,
            profileRole: input.profileRole as UserProfileRole,
            registerProfileCompletedAt: new Date(),
          },
        });
        await prismaMock.onboardingProfile.create({
          data: { userId: user.id, companyName: existingOrg.name },
        });
        await prismaMock.organizationMembership.create({
          data: {
            userId: user.id,
            organizationId: existingOrg.id,
            role: "MEMBER",
          },
        });
        return {
          ok: true as const,
          userId: user.id,
          organizationId: existingOrg.id,
          flow: "join_existing_organization" as const,
        };
      }
      const user = await prismaMock.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          signupWebsiteNormalized: input.signupWebsiteNormalized,
          firstName: input.firstName,
          lastName: input.lastName,
          profileRole: input.profileRole as UserProfileRole,
          registerProfileCompletedAt: new Date(),
        },
      });
      await prismaMock.onboardingProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, companyName: input.companyName },
        update: { companyName: input.companyName },
      });
      return {
        ok: true as const,
        userId: user.id,
        flow: "new_organization" as const,
      };
    },
  );
  signInFindUserMock = jest.fn(async (email: string) => {
    const { prisma: prismaMock } = await import("@/lib/prisma");
    const user = await prismaMock.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        status: true,
        systemRoles: { select: { role: true } },
        organizationMemberships: { select: { organizationId: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      passwordHash: user.passwordHash,
      status: user.status,
      isSuperAdmin: user.systemRoles.some(
        (r: { role: string }) => r.role === "SUPER_ADMIN",
      ),
      organizationMembershipCount: user.organizationMemberships.length,
    };
  });
  passwordResetFindUserMock = jest.fn(async (email: string) => {
    const { prisma: prismaMock } = await import("@/lib/prisma");
    const user = await prismaMock.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status === "DISABLED") return null;
    return { id: user.id, email: user.email };
  });
  passwordResetCreateTokenMock = jest.fn(
    async (input: { userId: string; rawToken: string; expiresAt: Date }) => {
      const { prisma: prismaMock } = await import("@/lib/prisma");
      const { hashToken } = await import("@/lib/auth/tokens");
      await prismaMock.passwordResetToken.create({
        data: {
          userId: input.userId,
          tokenHash: hashToken(input.rawToken),
          expiresAt: input.expiresAt,
        },
      });
    },
  );
  passwordResetConsumeMock = jest.fn(
    async (input: { rawToken: string; passwordHash: string }) => {
      const { prisma: prismaMock } = await import("@/lib/prisma");
      const { hashToken } = await import("@/lib/auth/tokens");
      const th = hashToken(input.rawToken);
      const row = await prismaMock.passwordResetToken.findFirst({
        where: {
          tokenHash: th,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!row) return { ok: false as const };
      await prismaMock.$transaction([
        prismaMock.user.update({
          where: { id: row.userId },
          data: { passwordHash: input.passwordHash },
        }),
        prismaMock.passwordResetToken.updateMany({
          where: { userId: row.userId },
          data: { consumedAt: new Date() },
        }),
      ]);
      return { ok: true as const };
    },
  );
  organizationInvitationsAcceptMock = jest.fn(
    async (input: {
      tokenPlaintext: string;
      userId: string;
      userEmail: string;
    }) => {
      const { prisma: prismaMock } = await import("@/lib/prisma");
      const { hashToken } = await import("@/lib/auth/tokens");
      const th = hashToken(input.tokenPlaintext);
      const inv = await prismaMock.organizationInvitation.findFirst({
        where: {
          tokenHash: th,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });
      if (!inv) return { ok: false as const, error: "INVALID" as const };
      if (input.userEmail.toLowerCase() !== inv.email.toLowerCase()) {
        return { ok: false as const, error: "EMAIL_MISMATCH" as const };
      }
      await prismaMock.$transaction([
        prismaMock.organizationMembership.upsert({
          where: {
            userId_organizationId: {
              userId: input.userId,
              organizationId: inv.organizationId,
            },
          },
          create: {
            userId: input.userId,
            organizationId: inv.organizationId,
            role: inv.role,
          },
          update: { role: inv.role },
        }),
        prismaMock.organizationInvitation.update({
          where: { id: inv.id },
          data: {
            status: "ACCEPTED",
            acceptedByUserId: input.userId,
          },
        }),
      ]);
      return { ok: true as const, organizationId: inv.organizationId };
    },
  );
  onboardingCompletionStep4Mock = jest.fn();
  return {
    getApplicationDeps: () => ({
      auth: {
        getAuthenticatedPrincipal: getAuthenticatedPrincipalMock,
      },
      users: {
        findById: findByIdMock,
        findRegisterGateByUserId: findRegisterGateByUserIdMock,
        completeRegisterProfile: completeRegisterProfileRepoMock,
        findUserWithOnboardingByUserId: findUserWithOnboardingByUserIdMock,
      },
      onboardingProfiles: {
        updateAfterStep1: updateAfterStep1Mock,
        updateAfterStep2: updateAfterStep2Mock,
        updateAfterStep3: updateAfterStep3Mock,
      },
      session: {
        createSessionRecord: createSessionRecordMock,
      },
      registration: {
        registerNewUser: registrationRegisterNewUserMock,
        registerFromOrganizationInvitation: jest
          .fn()
          .mockResolvedValue({ ok: false as const, error: "INVALID" as const }),
      },
      signInRead: {
        findUserForPasswordSignIn: signInFindUserMock,
      },
      passwordReset: {
        findActiveUserByEmail: passwordResetFindUserMock,
        createResetToken: passwordResetCreateTokenMock,
        resetPasswordWithToken: passwordResetConsumeMock,
      },
      organizationInvitations: {
        acceptPendingInvitation: organizationInvitationsAcceptMock,
      },
      onboardingCompletion: {
        completeStep4CreateOrganizationAndInvites: onboardingCompletionStep4Mock,
      },
      audit: {
        logPlatformAction: jest.fn().mockResolvedValue(undefined),
      },
    }),
  };
});

/** Shape of `prisma` under `@/lib/prisma` jest mock — delegates are `jest.fn`. */
type AuthActionsPrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  organization: { findUnique: jest.Mock };
  onboardingProfile: {
    findUnique: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
    create: jest.Mock;
  };
  passwordResetToken: {
    findFirst: jest.Mock;
    create: jest.Mock;
    updateMany: jest.Mock;
  };
  organizationInvitation: {
    findFirst: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  organizationMembership: { upsert: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};

import { prisma } from "@/lib/prisma";

const prismaMock = prisma as unknown as AuthActionsPrismaMock;
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
import type { UserProfileRole } from "@/src/core/domain/user-profile-role";

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  jest.clearAllMocks();
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
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    prismaMock.onboardingProfile.upsert.mockReset();
    prismaMock.onboardingProfile.upsert.mockResolvedValue({} as never);
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response("", { status: 200, statusText: "OK" }),
      ) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns validation error for invalid email", async () => {
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
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
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
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
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
        email: "a@b.co",
        website: "@@@",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toContain("invalide");
  });

  it("returns error when company name is empty", async () => {
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "   ",
        profileRole: "COMMERCIAL",
        email: "a@b.co",
        website: "https://example.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toContain("entreprise");
  });

  it("returns error when website host is not reachable", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network")) as typeof fetch;
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
        email: "a@b.co",
        website: "https://example.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toMatch(/joindre|site web/i);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns error when email domain does not match website", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
        email: "user@gmail.com",
        website: "https://acme.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toMatch(/domaine|professionnelle|invitation/i);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns error when email domain does not match existing organization website", async () => {
    prismaMock.organization.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if ("websiteNormalized" in where) {
          return { id: "org1", name: "Acme" } as never;
        }
        return null;
      },
    );
    prismaMock.user.findUnique.mockResolvedValue(null);
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
        email: "new@gmail.com",
        website: "https://acme.com",
        password: "password12",
        confirmPassword: "password12",
      }),
    );
    expect(r?.ok).toBe(false);
    expect(r?.message).toMatch(/domaine|professionnelle|invitation/i);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("joins existing organization when email subdomain matches website", async () => {
    prismaMock.organization.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if ("websiteNormalized" in where) {
          return { id: "org-acme", name: "Acme Corp" } as never;
        }
        return null;
      },
    );
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-join",
      email: "hire@mail.acme.com",
    } as never);
    prismaMock.onboardingProfile.create.mockResolvedValue({} as never);
    prismaMock.organizationMembership.create.mockResolvedValue({} as never);
    hashPasswordMock.mockResolvedValue("hash");
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);
    setActiveOrganizationCookieMock.mockResolvedValue(undefined);

    await expect(
      signUpAction(
        null,
        form({
          firstName: "Jane",
          lastName: "Doe",
          companyName: "Acme Corp",
          profileRole: "COMMERCIAL",
          email: "hire@mail.acme.com",
          website: "https://acme.com",
          password: "password12",
          confirmPassword: "password12",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/company");

    expect(prismaMock.organizationMembership.create).toHaveBeenCalledWith({
      data: {
        userId: "user-join",
        organizationId: "org-acme",
        role: "MEMBER",
      },
    });
    expect(setActiveOrganizationCookieMock).toHaveBeenCalledWith("org-acme");
  });

  it("returns error when email is already registered", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" } as never);
    const r = await signUpAction(
      null,
      form({
        firstName: "Ada",
        lastName: "Lovelace",
        companyName: "Analytical Engines Ltd",
        profileRole: "COMMERCIAL",
        email: "exists@newco.io",
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

  it("creates user, session, and redirects to onboarding", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      email: "hi@example.com",
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
          companyName: "Example Inc",
          profileRole: "SALES_MANAGER",
          email: "Hi@Example.com",
          website: "WWW.Example.COM/path",
          password: "password12",
          confirmPassword: "password12",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/onboarding");

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: "hi@example.com",
        passwordHash: "hash",
        signupWebsiteNormalized: "example.com",
        firstName: "Jane",
        lastName: "Doe",
        profileRole: "SALES_MANAGER",
        registerProfileCompletedAt: expect.any(Date),
      },
    });
    expect(prismaMock.onboardingProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "user-new" },
      create: { userId: "user-new", companyName: "Example Inc" },
      update: { companyName: "Example Inc" },
    });
    expect(createSessionRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-new" }),
    );
    expect(setSessionCookieMock).toHaveBeenCalled();
  });
});

describe("signInAction", () => {
  it("returns field errors for invalid payload", async () => {
    const r = await signInAction(
      null,
      form({ email: "bad", password: "x", next: "" }),
    );
    expect(r).toEqual({
      ok: false,
      message: "Adresse e-mail invalide.",
      fieldErrors: { email: "Adresse e-mail invalide." },
    });
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
      status: "ACTIVE",
      systemRoles: [],
      organizationMemberships: [],
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
      status: "ACTIVE",
      systemRoles: [],
      organizationMemberships: [{ organizationId: "org1" }],
    } as never);
    verifyPasswordMock.mockResolvedValue(true);
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signInAction(null, form({ email: "a@b.co", password: "password12" })),
    ).rejects.toThrow("REDIRECT:/company");
  });

  it("redirects to /admin when super admin has no organization", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
      status: "ACTIVE",
      systemRoles: [{ role: "SUPER_ADMIN" }],
      organizationMemberships: [],
    } as never);
    verifyPasswordMock.mockResolvedValue(true);
    createSessionRecordMock.mockResolvedValue(undefined);
    setSessionCookieMock.mockResolvedValue(undefined);

    await expect(
      signInAction(null, form({ email: "a@b.co", password: "password12" })),
    ).rejects.toThrow("REDIRECT:/admin");
  });

  it("redirects to safe relative next when provided", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "h",
      status: "ACTIVE",
      systemRoles: [],
      organizationMemberships: [{ organizationId: "org1" }],
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
      status: "ACTIVE",
      systemRoles: [],
      organizationMemberships: [{ organizationId: "org1" }],
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
    await expect(acceptOrganizationInvitationAction(raw)).rejects.toThrow(
      "REDIRECT:/company",
    );

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
    findUserWithOnboardingByUserIdMock.mockReset();
    findUserWithOnboardingByUserIdMock.mockResolvedValue({
      ...domainUser,
      registerProfileCompletedAt: new Date(),
      onboardingProfile: {
        id: "op1",
        userId: "u1",
        currentStep: 1,
        completedAt: null,
        companyName: "Acme SAS",
        industrySector: null,
        commercialTeamSize: null,
        averageSalesCycle: null,
        averageDealSize: null,
        companyPitch: null,
        objections: null,
        keyArguments: null,
        industryVocabulary: null,
        meetingTypes: null,
        pipelineStages: null,
        inviteEmails: null,
        inviteMessage: null,
      },
    });
  });

  it("submitOnboardingStep1 fails when profile has no company name", async () => {
    findUserWithOnboardingByUserIdMock.mockResolvedValue({
      ...domainUser,
      registerProfileCompletedAt: new Date(),
      onboardingProfile: {
        id: "op1",
        userId: "u1",
        currentStep: 1,
        completedAt: null,
        companyName: null,
        industrySector: null,
        commercialTeamSize: null,
        averageSalesCycle: null,
        averageDealSize: null,
        companyPitch: null,
        objections: null,
        keyArguments: null,
        industryVocabulary: null,
        meetingTypes: null,
        pipelineStages: null,
        inviteEmails: null,
        inviteMessage: null,
      },
    });
    const r = await submitOnboardingStep1({
      industrySector: null,
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
    });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toMatch(/entreprise|inscription/i);
  });

  it("submitOnboardingStep1 persists via repository using stored company name", async () => {
    updateAfterStep1Mock.mockResolvedValue(undefined);
    const r = await submitOnboardingStep1({
      industrySector: "IT",
      commercialTeamSize: null,
      averageSalesCycle: null,
      averageDealSize: null,
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
    onboardingCompletionStep4Mock.mockResolvedValueOnce({
      ok: false,
      error: "PROFILE_INCOMPLETE",
    });
    const r = await submitOnboardingStep4({ invites: [] });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain("étape entreprise");
  });

  it("submitOnboardingStep4 fails when website key already has an org", async () => {
    onboardingCompletionStep4Mock.mockResolvedValueOnce({
      ok: false,
      error: "WEBSITE_TAKEN",
    });

    const r = await submitOnboardingStep4({ invites: [] });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain("site web");
  });

  it("submitOnboardingStep4 creates org and redirects to /company", async () => {
    onboardingCompletionStep4Mock.mockResolvedValueOnce({
      ok: true,
      organizationId: "org-1",
      companyName: "Ma Société",
      mailPayloads: [{ to: "peer@b.co", link: "https://example.com/inv" }],
    });
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
    onboardingCompletionStep4Mock.mockResolvedValueOnce({
      ok: false,
      error: "UNIQUE_CONFLICT",
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
      submitOnboardingStep1({
        industrySector: null,
        commercialTeamSize: null,
        averageSalesCycle: null,
        averageDealSize: null,
      }),
    ).rejects.toThrow("REDIRECT:/sign-in");
  });
});
