import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

const ORG_ID = "clorg00000000000000000001";
const USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const MEMBERSHIP_ID = "clm12345678901234567890123";
const INVITATION_ID = "clinv00000000000000000001";
const OTHER_USER_ID = "clu12345678901234567890123";

// eslint-disable-next-line no-var
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
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
var cookiesSetMock: JestFn;
// eslint-disable-next-line no-var
var cookiesDeleteMock: JestFn;
jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    set: cookiesSetMock,
    delete: cookiesDeleteMock,
  })),
}));

// eslint-disable-next-line no-var
var loadOrgSettingsActorMock: JestFn;
jest.mock("@/lib/load-org-settings-access", () => {
  loadOrgSettingsActorMock = jest.fn();
  return { loadOrgSettingsActor: loadOrgSettingsActorMock };
});

// eslint-disable-next-line no-var
var readSuperAdminOrgCookieMock: JestFn;
jest.mock("@/lib/read-super-admin-org-cookie", () => {
  readSuperAdminOrgCookieMock = jest.fn().mockResolvedValue(null);
  return { readSuperAdminOrgCookie: readSuperAdminOrgCookieMock };
});

// eslint-disable-next-line no-var
var signSuperAdminOrgCookieValueMock: JestFn;
jest.mock("@/lib/super-admin-org-cookie-crypto", () => {
  signSuperAdminOrgCookieValueMock = jest.fn().mockReturnValue("signed-cookie");
  return { signSuperAdminOrgCookieValue: signSuperAdminOrgCookieValueMock };
});

// eslint-disable-next-line no-var
var hashPasswordMock: JestFn;
// eslint-disable-next-line no-var
var verifyPasswordMock: JestFn;
jest.mock("@/lib/auth/password", () => {
  hashPasswordMock = jest.fn();
  verifyPasswordMock = jest.fn();
  return { hashPassword: hashPasswordMock, verifyPassword: verifyPasswordMock };
});

// eslint-disable-next-line no-var
var generateOpaqueTokenMock: JestFn;
// eslint-disable-next-line no-var
var hashTokenMock: JestFn;
jest.mock("@/lib/auth/tokens", () => {
  generateOpaqueTokenMock = jest.fn(() => "raw-token");
  hashTokenMock = jest.fn(() => "hashed-token");
  return {
    generateOpaqueToken: generateOpaqueTokenMock,
    hashToken: hashTokenMock,
  };
});

// eslint-disable-next-line no-var
var sendTransactionalEmailMock: JestFn;
jest.mock("@/lib/email/mailer", () => {
  sendTransactionalEmailMock = jest.fn().mockResolvedValue(undefined);
  return { sendTransactionalEmail: sendTransactionalEmailMock };
});

// eslint-disable-next-line no-var
var uploadUserAvatarToBlobMock: JestFn;
jest.mock("@/lib/user-avatar-upload", () => {
  uploadUserAvatarToBlobMock = jest.fn();
  return { uploadUserAvatarToBlob: uploadUserAvatarToBlobMock };
});

// eslint-disable-next-line no-var
var uploadOrgLogoToBlobMock: JestFn;
jest.mock("@/lib/org-logo-upload", () => {
  uploadOrgLogoToBlobMock = jest.fn();
  return { uploadOrgLogoToBlob: uploadOrgLogoToBlobMock };
});

jest.mock("@/lib/blob-paths", () => ({
  blobUrlBelongsToUser: jest.fn(() => true),
  blobUrlBelongsToOrg: jest.fn(() => true),
  buildOrgBlobPath: jest.fn(
    (_orgId: string, _cat: string, filename: string) =>
      `orgs/${ORG_ID}/feedbacks/${filename}`,
  ),
}));

// eslint-disable-next-line no-var
var enterOrganizationAsSuperAdminMock: JestFn;
jest.mock("@/src/core/application/enter-organization-as-super-admin", () => {
  enterOrganizationAsSuperAdminMock = jest.fn();
  return { enterOrganizationAsSuperAdmin: enterOrganizationAsSuperAdminMock };
});

// eslint-disable-next-line no-var
var exitSuperAdminOrganizationContextMock: JestFn;
jest.mock("@/src/core/application/exit-super-admin-organization-context", () => {
  exitSuperAdminOrganizationContextMock = jest.fn();
  return {
    exitSuperAdminOrganizationContext: exitSuperAdminOrganizationContextMock,
  };
});

jest.mock("@/src/core/application/create-feedback", () => ({
  createFeedback: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line no-var
var getCurrentActorContextMock: JestFn;
jest.mock("@/src/core/application/get-current-actor-context", () => {
  getCurrentActorContextMock = jest.fn();
  return { getCurrentActorContext: getCurrentActorContextMock };
});

// eslint-disable-next-line no-var
var putBlobMock: JestFn;
jest.mock("@vercel/blob", () => {
  putBlobMock = jest.fn();
  return { put: putBlobMock };
});

// eslint-disable-next-line no-var
var resolveBlobPutAuthMock: JestFn;
jest.mock("@/lib/blob-config", () => {
  resolveBlobPutAuthMock = jest.fn(() => ({ token: "blob" }));
  return {
    blobPutOptions: jest.fn(() => ({})),
    resolveBlobPutAuth: resolveBlobPutAuthMock,
  };
});

type SettingsDepsMocks = {
  getAuthenticatedPrincipalMock: JestFn;
  organizationSettingsMock: Record<string, JestFn>;
  usersMock: Record<string, JestFn>;
  passwordResetMock: Record<string, JestFn>;
  organizationTeamMock: Record<string, JestFn>;
  orgDirectoryMock: Record<string, JestFn>;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: SettingsDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    organizationSettingsMock: {
      upsertContextFields: jest.fn().mockResolvedValue(undefined),
      upsertCoachFields: jest.fn().mockResolvedValue(undefined),
      upsertProcessFields: jest.fn().mockResolvedValue(undefined),
      upsertPlaybook: jest.fn().mockResolvedValue(undefined),
      upsertLogoUrl: jest.fn().mockResolvedValue(undefined),
      upsertEmailFields: jest.fn().mockResolvedValue(undefined),
      findByOrganizationId: jest.fn().mockResolvedValue(null),
    },
    usersMock: {
      updateAccountProfile: jest.fn().mockResolvedValue(undefined),
      updateAvatarUrl: jest.fn().mockResolvedValue(undefined),
      findPasswordHashByUserId: jest.fn(),
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
      findEmailById: jest.fn(),
    },
    passwordResetMock: {
      findActiveUserByEmail: jest.fn(),
      createResetToken: jest.fn().mockResolvedValue(undefined),
    },
    organizationTeamMock: {
      findUserIdByEmail: jest.fn().mockResolvedValue(null),
      findMembership: jest.fn(),
      findPendingInvitationForEmail: jest.fn().mockResolvedValue(null),
      getOrganizationName: jest.fn().mockResolvedValue("Acme"),
      createPendingInvitation: jest.fn().mockResolvedValue(undefined),
      findMembershipWithUserEmail: jest.fn(),
      countAdminsInOrganization: jest.fn(),
      updateMembershipRole: jest.fn().mockResolvedValue(undefined),
      findMembershipByIdForOrg: jest.fn(),
      deleteMembership: jest.fn().mockResolvedValue(undefined),
      findPendingInvitationByIdForOrg: jest.fn(),
      revokeInvitation: jest.fn().mockResolvedValue(undefined),
      updateMembershipFollowUpEmailPreferences: jest
        .fn()
        .mockResolvedValue(undefined),
    },
    orgDirectoryMock: {
      getOrganizationById: jest.fn().mockResolvedValue({ name: "Acme" }),
    },
  };
  const graph = {
    auth: { getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock },
    organizationSettings: mocks.organizationSettingsMock,
    users: mocks.usersMock,
    passwordReset: mocks.passwordResetMock,
    organizationTeam: mocks.organizationTeamMock,
    orgDirectory: mocks.orgDirectoryMock,
    audit: {
      logPlatformAction: jest.fn().mockResolvedValue(undefined),
    },
  };
  (graph as { __settingsTestMocks?: SettingsDepsMocks }).__settingsTestMocks =
    mocks;
  return { getApplicationDeps: () => graph };
});

import {
  updateOrganizationCoach,
  updateOrganizationContext,
  updateOrganizationEmailSettings,
  updateOrganizationPlaybook,
  updateOrganizationProcess,
  uploadOrganizationLogo,
  removeOrganizationLogo,
  updatePersonalFollowUpEmailSettings,
} from "@/app/[locale]/company/settings/actions";
import {
  changeRoleAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
} from "@/app/[locale]/company/settings/equipe/actions";
import {
  changeAccountPasswordAction,
  removeAccountAvatarAction,
  sendAccountPasswordResetEmailAction,
  updateAccountProfileAction,
  uploadAccountAvatarAction,
} from "@/app/[locale]/company/account/actions";
import {
  submitFeedbackAction,
  uploadFeedbackScreenshotAction,
} from "@/app/[locale]/company/feedback-actions";
import {
  enterSuperAdminOrganizationAction,
  exitSuperAdminOrganizationAction,
} from "@/app/[locale]/company/super-admin-actions";
import { getApplicationDeps } from "@/lib/application-deps";
import { blobUrlBelongsToUser, blobUrlBelongsToOrg } from "@/lib/blob-paths";

const {
  getAuthenticatedPrincipalMock,
  organizationSettingsMock,
  usersMock,
  passwordResetMock,
  organizationTeamMock,
} = (getApplicationDeps() as unknown as { __settingsTestMocks: SettingsDepsMocks })
  .__settingsTestMocks;

function mockOrgSettingsManager() {
  loadOrgSettingsActorMock.mockResolvedValue({
    organizationId: ORG_ID,
    userId: USER_ID,
    email: "admin@test.com",
    role: "ADMIN",
    canManageOrganizationSettings: true,
    organizationHasManager: true,
  });
}

function mockOrgMemberSettingsActor() {
  loadOrgSettingsActorMock.mockResolvedValue({
    organizationId: ORG_ID,
    userId: USER_ID,
    email: "member@test.com",
    role: "MEMBER",
    canManageOrganizationSettings: false,
    organizationHasManager: true,
  });
}

function mockAuthenticatedActorContext() {
  getCurrentActorContextMock.mockResolvedValue({
    kind: "authenticated",
    userId: USER_ID,
    email: "admin@test.com",
    activeOrganizationId: ORG_ID,
    systemRoles: [],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  readSuperAdminOrgCookieMock.mockResolvedValue(null);
  cookiesSetMock = jest.fn();
  cookiesDeleteMock = jest.fn();
  mockOrgSettingsManager();
  mockAuthenticatedActorContext();
  getAuthenticatedPrincipalMock.mockResolvedValue({
    userId: USER_ID,
    email: "admin@test.com",
    memberships: [{ organizationId: ORG_ID, role: "ADMIN" }],
    activeOrganizationIdFromCookie: ORG_ID,
    systemRoles: ["SUPER_ADMIN"],
  });
  enterOrganizationAsSuperAdminMock.mockResolvedValue({ ok: true });
  exitSuperAdminOrganizationContextMock.mockResolvedValue({ ok: true });
  putBlobMock.mockResolvedValue({
    url: `https://blob.example/orgs/${ORG_ID}/feedbacks/1.png`,
  });
  organizationTeamMock.findUserIdByEmail.mockResolvedValue(null);
  organizationTeamMock.findMembership.mockResolvedValue(null);
  organizationTeamMock.findPendingInvitationForEmail.mockResolvedValue(null);
});

describe("updateOrganizationContext", () => {
  it("returns access denied when actor cannot manage settings", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await updateOrganizationContext({ companyName: "Acme" });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
    expect(organizationSettingsMock.upsertContextFields).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid payload", async () => {
    const result = await updateOrganizationContext({
      companyName: "x".repeat(201),
    });
    expect(result).toEqual({ ok: false, message: "Données invalides." });
  });

  it("persists context and revalidates settings layout", async () => {
    const result = await updateOrganizationContext({
      companyName: "  Acme SAS  ",
      industrySector: "IT",
    });
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertContextFields).toHaveBeenCalledWith(
      ORG_ID,
      {
        companyName: "Acme SAS",
        industrySector: "IT",
        commercialTeamSize: null,
        averageSalesCycle: null,
        averageDealSize: null,
      },
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/company/settings",
      "layout",
    );
  });
});

describe("updateOrganizationCoach", () => {
  it("rejects users without settings access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await updateOrganizationCoach({
      objections: ["Prix"],
      keyArguments: ["ROI"],
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("updateOrganizationCoach rejects invalid payload", async () => {
    const result = await updateOrganizationCoach({
      objections: ["x".repeat(400)],
      keyArguments: [],
    });
    expect(result).toEqual({ ok: false, message: "Données invalides." });
  });

  it("persists coach fields", async () => {
    const result = await updateOrganizationCoach({
      objections: ["Prix"],
      keyArguments: ["ROI"],
    });
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertCoachFields).toHaveBeenCalled();
  });
});

describe("updateOrganizationProcess", () => {
  it("rejects users without settings access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await updateOrganizationProcess({
      meetingTypes: ["Découverte"],
      pipelineStages: ["Qualif"],
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("rejects empty meeting types", async () => {
    const result = await updateOrganizationProcess({
      meetingTypes: [],
      pipelineStages: ["Qualif"],
    });
    expect(result.ok).toBe(false);
  });

  it("persists process fields and revalidates", async () => {
    const result = await updateOrganizationProcess({
      meetingTypes: ["Découverte"],
      pipelineStages: ["Qualif"],
    });
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertProcessFields).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/rendez-vous/nouveau");
  });
});

/*
  Le formulaire est toujours envoyé complet, donc les cas de test le sont aussi.
  Cette fabrique écrit les huit champs en clair plutôt que d'appeler la fonction
  du domaine qui construit un formulaire vide : un test qui se sert du code
  testé pour fabriquer son entrée valide les deux ensemble et ne verrait pas
  une erreur commune aux deux.
*/
function playbookForm(
  overrides: Partial<{
    offer: string;
    idealCustomer: string;
    differentiators: string[];
    competitors: string[];
    salesMethod: string;
    qualificationCriteria: string[];
    pricingRules: string;
    redLines: string[];
  }> = {},
) {
  return {
    offer: "",
    idealCustomer: "",
    differentiators: [] as string[],
    competitors: [] as string[],
    salesMethod: "",
    qualificationCriteria: [] as string[],
    pricingRules: "",
    redLines: [] as string[],
    ...overrides,
  };
}

describe("updateOrganizationPlaybook", () => {
  it("rejects users without settings access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await updateOrganizationPlaybook(playbookForm());
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
    expect(organizationSettingsMock.upsertPlaybook).not.toHaveBeenCalled();
  });

  it("rejects a field longer than its limit", async () => {
    const result = await updateOrganizationPlaybook(
      playbookForm({ offer: "x".repeat(1501) }),
    );
    expect(result).toEqual({
      ok: false,
      message: "Playbook trop long : raccourcissez les champs signalés.",
    });
    expect(organizationSettingsMock.upsertPlaybook).not.toHaveBeenCalled();
  });

  it("rejects a list with too many items", async () => {
    const result = await updateOrganizationPlaybook(
      playbookForm({
        redLines: Array.from({ length: 13 }, (_, i) => `Ligne ${i}`),
      }),
    );
    expect(result.ok).toBe(false);
    expect(organizationSettingsMock.upsertPlaybook).not.toHaveBeenCalled();
  });

  it("clears the column when every field is blank", async () => {
    const result = await updateOrganizationPlaybook(
      playbookForm({ offer: "   ", differentiators: ["", "  "] }),
    );
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertPlaybook).toHaveBeenCalledWith(
      ORG_ID,
      null,
    );
  });

  it("persists only the filled fields, trimmed", async () => {
    const result = await updateOrganizationPlaybook(
      playbookForm({
        offer: "  Formation commerciale sur mesure  ",
        differentiators: ["  Formateurs issus du terrain  ", "   ", ""],
        redLines: ["Jamais de garantie de résultat"],
      }),
    );
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertPlaybook).toHaveBeenCalledWith(
      ORG_ID,
      {
        offer: "Formation commerciale sur mesure",
        differentiators: ["Formateurs issus du terrain"],
        redLines: ["Jamais de garantie de résultat"],
      },
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/company/settings",
      "layout",
    );
  });
});

describe("organization logo actions", () => {
  it("uploadOrganizationLogo rejects users without access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const fd = new FormData();
    fd.set("logo", new File(["x"], "logo.png", { type: "image/png" }));
    const result = await uploadOrganizationLogo(fd);
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("uploadOrganizationLogo rejects missing file", async () => {
    const result = await uploadOrganizationLogo(new FormData());
    expect(result).toEqual({ ok: false, message: "Aucun fichier reçu." });
  });

  it("uploadOrganizationLogo propagates upload failure", async () => {
    uploadOrgLogoToBlobMock.mockResolvedValue({
      ok: false,
      message: "Format non supporté.",
    });
    const fd = new FormData();
    fd.set("logo", new File(["x"], "logo.png", { type: "image/png" }));
    const result = await uploadOrganizationLogo(fd);
    expect(result).toEqual({ ok: false, message: "Format non supporté." });
  });

  it("uploadOrganizationLogo uploads and stores url", async () => {
    uploadOrgLogoToBlobMock.mockResolvedValue({
      ok: true,
      url: "https://blob.example/logo.png",
    });
    const fd = new FormData();
    fd.set("logo", new File(["x"], "logo.png", { type: "image/png" }));
    const result = await uploadOrganizationLogo(fd);
    expect(result).toEqual({
      ok: true,
      logoUrl: "https://blob.example/logo.png",
    });
  });

  it("removeOrganizationLogo clears logo", async () => {
    const result = await removeOrganizationLogo();
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertLogoUrl).toHaveBeenCalledWith(
      ORG_ID,
      null,
    );
  });

  it("removeOrganizationLogo rejects users without access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await removeOrganizationLogo();
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });
});

describe("email settings actions", () => {
  it("updateOrganizationEmailSettings rejects users without access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await updateOrganizationEmailSettings({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: null,
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("updateOrganizationEmailSettings rejects invalid payload", async () => {
    const result = await updateOrganizationEmailSettings({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: "x".repeat(10_001),
    });
    expect(result).toEqual({ ok: false, message: "Données invalides." });
  });

  it("updateOrganizationEmailSettings persists fields", async () => {
    const result = await updateOrganizationEmailSettings({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: "  Regards  ",
    });
    expect(result).toEqual({ ok: true });
    expect(organizationSettingsMock.upsertEmailFields).toHaveBeenCalledWith(
      ORG_ID,
      {
        emailTone: "formal",
        emailVouvoiement: true,
        emailSignature: "Regards",
      },
    );
  });

  it("updatePersonalFollowUpEmailSettings works without org email defaults", async () => {
    mockOrgMemberSettingsActor();
    organizationSettingsMock.findByOrganizationId.mockResolvedValue(null);
    const result = await updatePersonalFollowUpEmailSettings({
      emailTone: "informal",
      emailVouvoiement: false,
      emailSignature: null,
    });
    expect(result).toEqual({ ok: true });
  });

  it("updatePersonalFollowUpEmailSettings rejects invalid payload", async () => {
    mockOrgMemberSettingsActor();
    const result = await updatePersonalFollowUpEmailSettings({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: "x".repeat(10_001),
    });
    expect(result).toEqual({ ok: false, message: "Données invalides." });
  });

  it("updatePersonalFollowUpEmailSettings rejects managers", async () => {
    const result = await updatePersonalFollowUpEmailSettings({
      emailTone: "informal",
      emailVouvoiement: false,
      emailSignature: null,
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("updatePersonalFollowUpEmailSettings updates member preferences", async () => {
    mockOrgMemberSettingsActor();
    organizationSettingsMock.findByOrganizationId.mockResolvedValue({
      emailTone: "formal",
      emailVouvoiement: true,
      emailSignature: "Org sig",
    });
    const result = await updatePersonalFollowUpEmailSettings({
      emailTone: "informal",
      emailVouvoiement: false,
      emailSignature: "Mine",
    });
    expect(result).toEqual({ ok: true });
    expect(
      organizationTeamMock.updateMembershipFollowUpEmailPreferences,
    ).toHaveBeenCalled();
  });
});

describe("inviteMemberAction", () => {
  it("rejects users without org access", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await inviteMemberAction({
      email: "new@test.com",
      role: "MEMBER",
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("rejects invite when role is not allowed", async () => {
    loadOrgSettingsActorMock.mockResolvedValue({
      organizationId: ORG_ID,
      userId: USER_ID,
      email: "member@test.com",
      role: "MEMBER",
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });
    const result = await inviteMemberAction({
      email: "new@test.com",
      role: "ADMIN",
    });
    expect(result.ok).toBe(false);
  });

  it("returns validation error for invalid email", async () => {
    const result = await inviteMemberAction({
      email: "not-an-email",
      role: "MEMBER",
    });
    expect(result).toEqual({
      ok: false,
      message: "E-mail ou rôle invalide.",
    });
  });

  it("rejects self-invite", async () => {
    const result = await inviteMemberAction({
      email: "admin@test.com",
      role: "MEMBER",
    });
    expect(result).toEqual({
      ok: false,
      message: "Vous ne pouvez pas vous inviter vous-même.",
    });
  });

  it("rejects when user is already a member", async () => {
    organizationTeamMock.findUserIdByEmail.mockResolvedValue(OTHER_USER_ID);
    organizationTeamMock.findMembership.mockResolvedValue({ id: "m1" });
    const result = await inviteMemberAction({
      email: "existing@test.com",
      role: "MEMBER",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate pending invitation", async () => {
    organizationTeamMock.findPendingInvitationForEmail.mockResolvedValue({
      id: INVITATION_ID,
    });
    const result = await inviteMemberAction({
      email: "pending@test.com",
      role: "MEMBER",
    });
    expect(result.ok).toBe(false);
  });

  it("creates invitation and sends email", async () => {
    organizationTeamMock.getOrganizationName.mockResolvedValue(null);
    const result = await inviteMemberAction({
      email: "new@test.com",
      role: "MEMBER",
    });
    expect(result).toEqual({ ok: true });
    expect(organizationTeamMock.createPendingInvitation).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
  });
});

describe("changeRoleAction", () => {
  it("rejects non-admin users", async () => {
    loadOrgSettingsActorMock.mockResolvedValue({
      organizationId: ORG_ID,
      userId: USER_ID,
      email: "member@test.com",
      role: "MEMBER",
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });
    const result = await changeRoleAction(MEMBERSHIP_ID, "ADMIN");
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("rejects invalid membership id", async () => {
    const result = await changeRoleAction("bad", "MEMBER");
    expect(result).toEqual({ ok: false, message: "Identifiant invalide." });
  });

  it("rejects missing membership", async () => {
    organizationTeamMock.findMembershipWithUserEmail.mockResolvedValue(null);
    const result = await changeRoleAction(MEMBERSHIP_ID, "ADMIN");
    expect(result).toEqual({ ok: false, message: "Membre introuvable." });
  });

  it("rejects demoting last admin", async () => {
    organizationTeamMock.findMembershipWithUserEmail.mockResolvedValue({
      id: MEMBERSHIP_ID,
      role: "ADMIN",
    });
    organizationTeamMock.countAdminsInOrganization.mockResolvedValue(1);
    const result = await changeRoleAction(MEMBERSHIP_ID, "MEMBER");
    expect(result.ok).toBe(false);
  });

  it("updates membership role", async () => {
    organizationTeamMock.findMembershipWithUserEmail.mockResolvedValue({
      id: MEMBERSHIP_ID,
      role: "MEMBER",
    });
    const result = await changeRoleAction(MEMBERSHIP_ID, "ADMIN");
    expect(result).toEqual({ ok: true });
    expect(organizationTeamMock.updateMembershipRole).toHaveBeenCalledWith(
      MEMBERSHIP_ID,
      "ADMIN",
    );
  });
});

describe("removeMemberAction", () => {
  it("rejects invalid membership id", async () => {
    const result = await removeMemberAction("bad");
    expect(result).toEqual({ ok: false, message: "Identifiant invalide." });
  });

  it("rejects non-admin users", async () => {
    loadOrgSettingsActorMock.mockResolvedValue({
      organizationId: ORG_ID,
      userId: USER_ID,
      email: "member@test.com",
      role: "MEMBER",
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });
    const result = await removeMemberAction(MEMBERSHIP_ID);
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("removeMemberAction rejects missing membership", async () => {
    organizationTeamMock.findMembershipByIdForOrg.mockResolvedValue(null);
    const result = await removeMemberAction(MEMBERSHIP_ID);
    expect(result).toEqual({ ok: false, message: "Membre introuvable." });
  });

  it("rejects self-removal", async () => {
    organizationTeamMock.findMembershipByIdForOrg.mockResolvedValue({
      id: MEMBERSHIP_ID,
      userId: USER_ID,
      role: "ADMIN",
    });
    const result = await removeMemberAction(MEMBERSHIP_ID);
    expect(result.ok).toBe(false);
  });

  it("rejects removing last admin", async () => {
    organizationTeamMock.findMembershipByIdForOrg.mockResolvedValue({
      id: MEMBERSHIP_ID,
      userId: OTHER_USER_ID,
      role: "ADMIN",
    });
    organizationTeamMock.countAdminsInOrganization.mockResolvedValue(1);
    const result = await removeMemberAction(MEMBERSHIP_ID);
    expect(result.ok).toBe(false);
  });

  it("removes another member", async () => {
    organizationTeamMock.findMembershipByIdForOrg.mockResolvedValue({
      id: MEMBERSHIP_ID,
      userId: OTHER_USER_ID,
      role: "MEMBER",
    });
    const result = await removeMemberAction(MEMBERSHIP_ID);
    expect(result).toEqual({ ok: true });
    expect(organizationTeamMock.deleteMembership).toHaveBeenCalledWith(
      MEMBERSHIP_ID,
    );
  });
});

describe("revokeInvitationAction", () => {
  it("rejects non-admin users", async () => {
    loadOrgSettingsActorMock.mockResolvedValue({
      organizationId: ORG_ID,
      userId: USER_ID,
      email: "member@test.com",
      role: "MEMBER",
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });
    const result = await revokeInvitationAction(INVITATION_ID);
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("rejects invalid invitation id", async () => {
    const result = await revokeInvitationAction("bad");
    expect(result).toEqual({ ok: false, message: "Identifiant invalide." });
  });

  it("revokeInvitationAction rejects missing invitation", async () => {
    organizationTeamMock.findPendingInvitationByIdForOrg.mockResolvedValue(null);
    const result = await revokeInvitationAction(INVITATION_ID);
    expect(result).toEqual({
      ok: false,
      message: "Invitation introuvable ou déjà traitée.",
    });
  });

  it("revokes pending invitation", async () => {
    organizationTeamMock.findPendingInvitationByIdForOrg.mockResolvedValue({
      id: INVITATION_ID,
    });
    const result = await revokeInvitationAction(INVITATION_ID);
    expect(result).toEqual({ ok: true });
    expect(organizationTeamMock.revokeInvitation).toHaveBeenCalledWith(
      INVITATION_ID,
    );
  });
});

describe("updateAccountProfileAction", () => {
  it("returns session expired when unauthenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await updateAccountProfileAction({
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(result).toEqual({ ok: false, message: "Session expirée." });
    expect(usersMock.updateAccountProfile).not.toHaveBeenCalled();
  });

  it("updates profile when valid", async () => {
    const result = await updateAccountProfileAction({
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(result).toEqual({ ok: true, message: "Profil enregistré." });
    expect(usersMock.updateAccountProfile).toHaveBeenCalled();
  });

  it("rejects invalid profile fields", async () => {
    const result = await updateAccountProfileAction({
      firstName: "",
      lastName: "Lovelace",
    });
    expect(result).toEqual({
      ok: false,
      message: "Vérifiez le prénom et le nom.",
    });
  });
});

describe("account avatar actions", () => {
  it("uploadAccountAvatarAction rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await uploadAccountAvatarAction(new FormData());
    expect(result).toEqual({ ok: false, message: "Session expirée." });
  });

  it("uploadAccountAvatarAction rejects missing file", async () => {
    const result = await uploadAccountAvatarAction(new FormData());
    expect(result).toEqual({ ok: false, message: "Aucun fichier reçu." });
  });

  it("uploadAccountAvatarAction stores avatar url", async () => {
    uploadUserAvatarToBlobMock.mockResolvedValue({
      ok: true,
      url: `https://blob.example/users/${USER_ID}/avatars/a.png`,
    });
    const fd = new FormData();
    fd.set("avatar", new File(["x"], "a.png", { type: "image/png" }));
    const result = await uploadAccountAvatarAction(fd);
    expect(result).toEqual({
      ok: true,
      message: "Photo de profil enregistrée.",
    });
  });

  it("uploadAccountAvatarAction propagates upload failure", async () => {
    uploadUserAvatarToBlobMock.mockResolvedValue({
      ok: false,
      message: "Fichier trop volumineux.",
    });
    const fd = new FormData();
    fd.set("avatar", new File(["x"], "a.png", { type: "image/png" }));
    const result = await uploadAccountAvatarAction(fd);
    expect(result).toEqual({ ok: false, message: "Fichier trop volumineux." });
  });

  it("uploadAccountAvatarAction rejects invalid blob url", async () => {
    uploadUserAvatarToBlobMock.mockResolvedValue({
      ok: true,
      url: "https://evil.example/a.png",
    });
    (blobUrlBelongsToUser as JestFn).mockReturnValueOnce(false);
    const fd = new FormData();
    fd.set("avatar", new File(["x"], "a.png", { type: "image/png" }));
    const result = await uploadAccountAvatarAction(fd);
    expect(result).toEqual({ ok: false, message: "Téléversement invalide." });
  });

  it("removeAccountAvatarAction clears avatar", async () => {
    const result = await removeAccountAvatarAction();
    expect(result).toEqual({
      ok: true,
      message: "Photo de profil supprimée.",
    });
  });

  it("removeAccountAvatarAction rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await removeAccountAvatarAction();
    expect(result).toEqual({ ok: false, message: "Session expirée." });
  });
});

describe("changeAccountPasswordAction", () => {
  it("rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await changeAccountPasswordAction({
      currentPassword: "old",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    expect(result).toEqual({ ok: false, message: "Session expirée." });
  });

  it("returns invalid password message when only current password fails", async () => {
    const result = await changeAccountPasswordAction({
      currentPassword: "",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    expect(result).toEqual({
      ok: false,
      message: "Mot de passe invalide.",
    });
  });

  it("rejects short new password", async () => {
    const result = await changeAccountPasswordAction({
      currentPassword: "old-password-ok",
      newPassword: "1234567",
      confirmPassword: "1234567",
    });
    expect(result).toEqual({
      ok: false,
      message: expect.stringMatching(/8|caractères/i),
    });
  });

  it("rejects mismatched passwords", async () => {
    const result = await changeAccountPasswordAction({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "other",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects when account has no password hash", async () => {
    usersMock.findPasswordHashByUserId.mockResolvedValue(null);
    const result = await changeAccountPasswordAction({
      currentPassword: "old",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    expect(result).toEqual({ ok: false, message: "Compte introuvable." });
  });

  it("rejects wrong current password", async () => {
    usersMock.findPasswordHashByUserId.mockResolvedValue("hash");
    verifyPasswordMock.mockResolvedValue(false);
    const result = await changeAccountPasswordAction({
      currentPassword: "wrong",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    expect(result).toEqual({
      ok: false,
      message: "Mot de passe actuel incorrect.",
    });
  });

  it("updates password when valid", async () => {
    usersMock.findPasswordHashByUserId.mockResolvedValue("hash");
    verifyPasswordMock.mockResolvedValue(true);
    hashPasswordMock.mockResolvedValue("new-hash");
    const result = await changeAccountPasswordAction({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    expect(result).toEqual({ ok: true, message: "Mot de passe mis à jour." });
  });
});

describe("sendAccountPasswordResetEmailAction", () => {
  it("rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await sendAccountPasswordResetEmailAction();
    expect(result).toEqual({ ok: false, message: "Session expirée." });
  });

  it("rejects missing email on account", async () => {
    usersMock.findEmailById.mockResolvedValue(null);
    const result = await sendAccountPasswordResetEmailAction();
    expect(result).toEqual({ ok: false, message: "Compte introuvable." });
  });

  it("rejects inactive reset user", async () => {
    usersMock.findEmailById.mockResolvedValue("admin@test.com");
    passwordResetMock.findActiveUserByEmail.mockResolvedValue(null);
    const result = await sendAccountPasswordResetEmailAction();
    expect(result).toEqual({ ok: false, message: "Compte introuvable." });
  });

  it("sends reset email", async () => {
    usersMock.findEmailById.mockResolvedValue("admin@test.com");
    passwordResetMock.findActiveUserByEmail.mockResolvedValue({
      id: USER_ID,
      email: "admin@test.com",
    });
    const result = await sendAccountPasswordResetEmailAction();
    expect(result.ok).toBe(true);
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
  });
});

describe("submitFeedbackAction", () => {
  it("returns failure for invalid payload", async () => {
    const result = await submitFeedbackAction({
      type: "BUG",
      message: "bad",
    });
    expect(result).toEqual({ ok: false });
  });

  it("returns failure when unauthenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await submitFeedbackAction({
      type: "BUG",
      message: "Something is broken on this page.",
    });
    expect(result).toEqual({ ok: false });
  });

  it("creates feedback when authenticated", async () => {
    const result = await submitFeedbackAction({
      type: "BUG",
      message: "Something is broken on this page.",
      userAgent: "Mozilla/5.0",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects feedback with foreign screenshot url", async () => {
    (blobUrlBelongsToOrg as JestFn).mockReturnValueOnce(false);
    const result = await submitFeedbackAction({
      type: "BUG",
      message: "Something is broken on this page.",
      screenshotUrl: "https://blob.example/orgs/other/feedbacks/x.png",
    });
    expect(result).toEqual({ ok: false });
  });
});

describe("uploadFeedbackScreenshotAction", () => {
  it("rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await uploadFeedbackScreenshotAction(new FormData());
    expect(result).toEqual({ ok: false });
  });

  it("rejects users without active organization", async () => {
    getCurrentActorContextMock.mockResolvedValue({ kind: "guest" });
    const result = await uploadFeedbackScreenshotAction(new FormData());
    expect(result).toEqual({ ok: false });
  });

  it("rejects missing file", async () => {
    const result = await uploadFeedbackScreenshotAction(new FormData());
    expect(result).toEqual({ ok: false });
  });

  it("rejects when blob auth is missing", async () => {
    resolveBlobPutAuthMock.mockReturnValueOnce(null);
    const fd = new FormData();
    fd.set("file", new File(["png"], "shot.png", { type: "image/png" }));
    const result = await uploadFeedbackScreenshotAction(fd);
    expect(result).toEqual({ ok: false });
  });

  it("uploads screenshot for org member", async () => {
    const fd = new FormData();
    fd.set("file", new File(["png"], "shot.png", { type: "image/png" }));
    const result = await uploadFeedbackScreenshotAction(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toContain("blob.example");
    }
  });
});

describe("enterSuperAdminOrganizationAction", () => {
  it("returns validation error for empty organization id", async () => {
    const result = await enterSuperAdminOrganizationAction({
      targetOrganizationId: "",
      role: "ADMIN",
    });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("enters organization and redirects", async () => {
    await expect(
      enterSuperAdminOrganizationAction({
        targetOrganizationId: ORG_ID,
        role: "ADMIN",
        reason: "Support",
      }),
    ).rejects.toThrow("REDIRECT:/company");
    expect(cookiesSetMock).toHaveBeenCalled();
    expect(enterOrganizationAsSuperAdminMock).toHaveBeenCalled();
  });

  it("returns NOT_AUTHENTICATED when principal disappears after enter", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await enterSuperAdminOrganizationAction({
      targetOrganizationId: ORG_ID,
      role: "MEMBER",
    });
    expect(result).toEqual({ ok: false, error: "NOT_AUTHENTICATED" });
  });
});

describe("exitSuperAdminOrganizationAction", () => {
  it("returns validation error for invalid payload", async () => {
    const result = await exitSuperAdminOrganizationAction({
      organizationId: "x".repeat(200),
    });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("returns NO_ELEVATION without cookie", async () => {
    const result = await exitSuperAdminOrganizationAction({});
    expect(result).toEqual({ ok: false, error: "NO_ELEVATION" });
  });

  it("returns ORG_MISMATCH when client org differs from cookie", async () => {
    readSuperAdminOrgCookieMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "ADMIN",
    });
    const result = await exitSuperAdminOrganizationAction({
      organizationId: "clorg00000000000000000099",
    });
    expect(result).toEqual({ ok: false, error: "ORG_MISMATCH" });
  });

  it("exits elevation and redirects", async () => {
    readSuperAdminOrgCookieMock.mockResolvedValue({
      organizationId: ORG_ID,
      role: "ADMIN",
    });
    await expect(
      exitSuperAdminOrganizationAction({ organizationId: ORG_ID }),
    ).rejects.toThrow("REDIRECT:/company");
    expect(cookiesDeleteMock).toHaveBeenCalled();
  });
});
