import { beforeEach, describe, expect, it } from "@jest/globals";
import type { Mock } from "jest-mock";

type AdminAppDepsMocks = {
  getAuthenticatedPrincipalMock: Mock;
  findByIdMock: Mock;
  backofficeMock: Record<string, Mock>;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: AdminAppDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    findByIdMock: jest.fn(),
    backofficeMock: {
      findOrganizationBySlug: jest.fn(),
      createOrganization: jest.fn(),
      findOrganizationById: jest.fn(),
      findOrganizationSlugConflict: jest.fn(),
      updateOrganization: jest.fn(),
      findOrganizationsByIds: jest.fn(),
      deleteOrganizationsByIds: jest.fn(),
      deleteOrganizationById: jest.fn(),
      createSuperAdminAuditLog: jest.fn(),
      createSuperAdminAuditLogsMany: jest.fn(),
      findUsersByIdsForBulk: jest.fn(),
      updateUsersStatusMany: jest.fn(),
      findUserStatusById: jest.fn(),
      updateUserStatus: jest.fn(),
      findUserByIdExists: jest.fn(),
      findUserEmailConflict: jest.fn(),
      updateUserProfile: jest.fn(),
      findUserForDelete: jest.fn(),
      deleteUserById: jest.fn(),
      findOrganizationNameById: jest.fn(),
      findPendingOrganizationInvitation: jest.fn(),
      createOrganizationInvitationAdmin: jest.fn(),
      findUserWithSuperAdminByEmail: jest.fn(),
      findPendingSuperAdminInvitationByEmail: jest.fn(),
      createSuperAdminInvitation: jest.fn(),
      findPendingSuperAdminInvitationById: jest.fn(),
      revokeSuperAdminInvitation: jest.fn(),
      findSuperAdminSystemRoleForUser: jest.fn(),
      deleteSystemRole: jest.fn(),
    },
  };
  const graph = {
    auth: {
      getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock,
    },
    users: {
      findById: mocks.findByIdMock,
    },
    backoffice: mocks.backofficeMock,
  };
  (graph as { __adminTestMocks?: AdminAppDepsMocks }).__adminTestMocks = mocks;
  return { getApplicationDeps: () => graph };
});

// eslint-disable-next-line no-var -- Jest mock factories run before `let` bindings exist
var revalidatePathMock: Mock;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var sendTransactionalEmailMock: Mock;
jest.mock("@/lib/email/mailer", () => {
  sendTransactionalEmailMock = jest.fn().mockResolvedValue(undefined);
  return { sendTransactionalEmail: sendTransactionalEmailMock };
});

// eslint-disable-next-line no-var
var generateOpaqueTokenMock: Mock;
// eslint-disable-next-line no-var
var hashTokenMock: Mock;
jest.mock("@/lib/auth/tokens", () => {
  generateOpaqueTokenMock = jest.fn(() => "raw-invite-token");
  hashTokenMock = jest.fn(() => "hashed-token");
  return {
    generateOpaqueToken: generateOpaqueTokenMock,
    hashToken: hashTokenMock,
  };
});

// eslint-disable-next-line no-var
var publishGlobalPromptVersionMock: Mock;
jest.mock("@/src/core/application/publish-global-prompt-version", () => {
  publishGlobalPromptVersionMock = jest.fn();
  return { publishGlobalPromptVersion: publishGlobalPromptVersionMock };
});

const ACTOR_ID = "cjld2cjxh0000qzrmn831i7rn";
const OTHER_USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const ORG_ID = "clorg00000000000000000001";
const INVITE_ID = "clinv00000000000000000001";

import {
  bulkDeleteOrganizationsAction,
  createOrganizationAction,
  deleteOrganizationAction,
  updateOrganizationAction,
} from "@/app/[locale]/admin/organizations/actions";
import {
  bulkToggleUserStatusAction,
  deleteUserAction,
  inviteUserToOrgAction,
  toggleUserStatusAction,
  updateUserAction,
} from "@/app/[locale]/admin/users/actions";
import {
  inviteSuperAdminAction,
  revokeSuperAdminInvitationAction,
  revokeSuperAdminRoleAction,
} from "@/app/[locale]/admin/super-admins/actions";
import { publishPromptAction } from "@/app/[locale]/admin/prompts/actions";
import { getApplicationDeps } from "@/lib/application-deps";

const {
  getAuthenticatedPrincipalMock,
  findByIdMock,
  backofficeMock,
} = (getApplicationDeps() as { __adminTestMocks: AdminAppDepsMocks })
  .__adminTestMocks;

function mockAuthenticatedSuperAdminPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
  findByIdMock.mockResolvedValue({
    id: ACTOR_ID,
    email: "actor@test.com",
    systemRoles: ["SUPER_ADMIN"],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  getAuthenticatedPrincipalMock.mockReset();
  findByIdMock.mockReset();
  publishGlobalPromptVersionMock.mockReset();
  publishGlobalPromptVersionMock.mockImplementation(async (_deps, input) => {
    if (!input.isSuperAdmin) {
      return { ok: false as const, error: "NOT_SUPER_ADMIN" as const };
    }
    return { ok: true as const, version: 99 };
  });
  for (const fn of Object.values(backofficeMock)) {
    if (typeof fn === "function" && "mockReset" in fn) {
      (fn as ReturnType<typeof jest.fn>).mockReset();
    }
  }
  sendTransactionalEmailMock.mockResolvedValue(undefined);
  mockAuthenticatedSuperAdminPrincipal();
});

describe("admin super-admin CRUD — organizations", () => {
  it("rejects create when not authenticated", async () => {
    findByIdMock.mockReset();
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const r = await createOrganizationAction({ name: "Acme", slug: "acme" });
    expect(r).toEqual({ ok: false, message: "Non authentifié." });
    expect(backofficeMock.createOrganization).not.toHaveBeenCalled();
  });

  it("creates organization and writes audit when super admin", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationBySlug.mockResolvedValue(null);
    backofficeMock.createOrganization.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await createOrganizationAction({
      name: "Acme",
      slug: "acme-new",
    });
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.createOrganization).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme-new",
    });
    expect(backofficeMock.createSuperAdminAuditLog).toHaveBeenCalledWith({
      actorUserId: ACTOR_ID,
      organizationId: "system",
      action: "CREATE_ORGANIZATION",
      reason: expect.stringContaining("Acme"),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/organizations");
  });

  it("rejects create on duplicate slug", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationBySlug.mockResolvedValue({ id: "x" });

    const r = await createOrganizationAction({ name: "Acme", slug: "taken" });
    expect(r).toEqual({ ok: false, message: "Ce slug est déjà utilisé." });
    expect(backofficeMock.createOrganization).not.toHaveBeenCalled();
  });

  it("rejects update when slug belongs to another org", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationById.mockResolvedValue({
      id: ORG_ID,
      name: "Old",
      slug: "old-slug",
    });
    backofficeMock.findOrganizationSlugConflict.mockResolvedValue(true);

    const r = await updateOrganizationAction({
      id: ORG_ID,
      name: "New",
      slug: "conflict-slug",
    });
    expect(r).toEqual({
      ok: false,
      message: "Ce slug est déjà utilisé par une autre organisation.",
    });
    expect(backofficeMock.updateOrganization).not.toHaveBeenCalled();
  });

  it("deletes organization and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationById.mockResolvedValue({
      id: ORG_ID,
      name: "Gone",
      slug: "gone",
    });
    backofficeMock.deleteOrganizationById.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await deleteOrganizationAction(ORG_ID);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.deleteOrganizationById).toHaveBeenCalledWith(ORG_ID);
    expect(backofficeMock.createSuperAdminAuditLog).toHaveBeenCalled();
  });

  it("bulk delete writes audit per org", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationsByIds.mockResolvedValue([
      { id: "a", name: "A", slug: "a" },
      { id: "b", name: "B", slug: "b" },
    ]);
    backofficeMock.deleteOrganizationsByIds.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLogsMany.mockResolvedValue(undefined);

    const r = await bulkDeleteOrganizationsAction(["a", "b"]);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.createSuperAdminAuditLogsMany).toHaveBeenCalled();
    expect(backofficeMock.deleteOrganizationsByIds).toHaveBeenCalledWith([
      "a",
      "b",
    ]);
  });

  it("rejects bulk delete with empty ids", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await bulkDeleteOrganizationsAction([]);
    expect(r).toEqual({ ok: false, message: "Aucun ID fourni." });
  });
});

describe("admin super-admin CRUD — users", () => {
  it("rejects bulk toggle with empty ids", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await bulkToggleUserStatusAction([], "DISABLED");
    expect(r).toEqual({ ok: false, message: "Aucun ID fourni." });
  });

  it("bulk toggles user status and writes audit rows", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUsersByIdsForBulk.mockResolvedValue([
      { id: "u1", email: "a@x.com" },
      { id: "u2", email: "b@x.com" },
    ]);
    backofficeMock.updateUsersStatusMany.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLogsMany.mockResolvedValue(undefined);

    const r = await bulkToggleUserStatusAction(["u1", "u2"], "DISABLED");
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.updateUsersStatusMany).toHaveBeenCalledWith(
      ["u1", "u2"],
      "DISABLED",
    );
    expect(backofficeMock.createSuperAdminAuditLogsMany).toHaveBeenCalled();
  });

  it("toggles user status and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserStatusById.mockResolvedValue({
      id: OTHER_USER_ID,
      status: "ACTIVE",
      email: "u@example.com",
    });
    backofficeMock.updateUserStatus.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await toggleUserStatusAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.updateUserStatus).toHaveBeenCalledWith(
      OTHER_USER_ID,
      "DISABLED",
    );
    expect(backofficeMock.createSuperAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "BLOCK_USER",
      }),
    );
  });

  it("rejects update user when email taken", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserByIdExists.mockResolvedValue({ id: OTHER_USER_ID });
    backofficeMock.findUserEmailConflict.mockResolvedValue(true);

    const r = await updateUserAction({
      id: OTHER_USER_ID,
      firstName: "A",
      lastName: "B",
      email: "taken@example.com",
    });
    expect(r).toEqual({ ok: false, message: "Cet e-mail est déjà utilisé." });
    expect(backofficeMock.updateUserProfile).not.toHaveBeenCalled();
  });

  it("updates user profile and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserByIdExists.mockResolvedValue({ id: OTHER_USER_ID });
    backofficeMock.findUserEmailConflict.mockResolvedValue(false);
    backofficeMock.updateUserProfile.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await updateUserAction({
      id: OTHER_USER_ID,
      firstName: "Ann",
      lastName: "Lee",
      email: "new@example.com",
    });
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.updateUserProfile).toHaveBeenCalledWith({
      userId: OTHER_USER_ID,
      firstName: "Ann",
      lastName: "Lee",
      email: "new@example.com",
    });
  });

  it("deletes user and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserForDelete.mockResolvedValue({
      id: OTHER_USER_ID,
      email: "gone@example.com",
    });
    backofficeMock.deleteUserById.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await deleteUserAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.deleteUserById).toHaveBeenCalledWith(OTHER_USER_ID);
  });

  it("invites user to org when valid", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationNameById.mockResolvedValue({
      name: "Org",
    });
    backofficeMock.findPendingOrganizationInvitation.mockResolvedValue(null);
    backofficeMock.createOrganizationInvitationAdmin.mockResolvedValue(
      undefined,
    );
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await inviteUserToOrgAction({
      email: "join@example.com",
      organizationId: ORG_ID,
      role: "MEMBER",
    });
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.createOrganizationInvitationAdmin).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
    expect(backofficeMock.createSuperAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "INVITE_USER_TO_ORG" }),
    );
  });

  it("rejects org invite when org missing", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findOrganizationNameById.mockResolvedValue(null);

    const r = await inviteUserToOrgAction({
      email: "join@example.com",
      organizationId: ORG_ID,
      role: "ADMIN",
    });
    expect(r).toEqual({ ok: false, message: "Organisation introuvable." });
    expect(
      backofficeMock.createOrganizationInvitationAdmin,
    ).not.toHaveBeenCalled();
  });
});

describe("admin super-admin — super-admins & prompts", () => {
  it("inviteSuperAdmin rejects when user already super admin", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserWithSuperAdminByEmail.mockResolvedValueOnce({
      id: "existing",
    });

    const r = await inviteSuperAdminAction({ email: "boss@example.com" });
    expect(r).toEqual({
      ok: false,
      message: "Cet utilisateur est déjà super administrateur.",
    });
    expect(backofficeMock.createSuperAdminInvitation).not.toHaveBeenCalled();
  });

  it("inviteSuperAdmin creates pending invitation and sends email", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findUserWithSuperAdminByEmail.mockResolvedValueOnce(null);
    backofficeMock.findPendingSuperAdminInvitationByEmail.mockResolvedValue(
      null,
    );
    backofficeMock.createSuperAdminInvitation.mockResolvedValue(undefined);

    const r = await inviteSuperAdminAction({ email: "newadmin@example.com" });
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.createSuperAdminInvitation).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
  });

  it("revokeSuperAdminInvitation rejects invalid id", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await revokeSuperAdminInvitationAction("not-a-cuid");
    expect(r).toEqual({ ok: false, message: "Identifiant invalide." });
  });

  it("revokeSuperAdminInvitation revokes pending invite", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findPendingSuperAdminInvitationById.mockResolvedValue({
      id: INVITE_ID,
    });
    backofficeMock.revokeSuperAdminInvitation.mockResolvedValue(undefined);

    const r = await revokeSuperAdminInvitationAction(INVITE_ID);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.revokeSuperAdminInvitation).toHaveBeenCalledWith(
      INVITE_ID,
    );
  });

  it("revokeSuperAdminRole rejects self-revoke", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await revokeSuperAdminRoleAction(ACTOR_ID);
    expect(r).toEqual({
      ok: false,
      message: "Vous ne pouvez pas révoquer votre propre rôle.",
    });
    expect(backofficeMock.deleteSystemRole).not.toHaveBeenCalled();
  });

  it("revokeSuperAdminRole deletes role and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    backofficeMock.findSuperAdminSystemRoleForUser.mockResolvedValue({
      roleRecordId: "role-row-id",
      userEmail: "target@example.com",
    });
    backofficeMock.deleteSystemRole.mockResolvedValue(undefined);
    backofficeMock.createSuperAdminAuditLog.mockResolvedValue(undefined);

    const r = await revokeSuperAdminRoleAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(backofficeMock.deleteSystemRole).toHaveBeenCalledWith("role-row-id");
    expect(backofficeMock.createSuperAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REVOKE_SUPER_ADMIN" }),
    );
  });

  it("publishPromptAction rejects unauthenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const r = await publishPromptAction({
      kind: "SONCAS",
      markdown: "# x",
      auditAction: "PUBLISH_PROMPT",
    });
    expect(r).toEqual({ ok: false, error: "UNAUTHENTICATED" });
    expect(publishGlobalPromptVersionMock).not.toHaveBeenCalled();
  });

  it("publishPromptAction rejects non–super admin", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
    findByIdMock.mockResolvedValue({
      id: ACTOR_ID,
      email: "a@b.com",
      systemRoles: ["MEMBER"],
    });

    const r = await publishPromptAction({
      kind: "DISC",
      markdown: "# body",
      auditAction: "PUBLISH_PROMPT",
    });
    expect(r).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
    expect(publishGlobalPromptVersionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isSuperAdmin: false }),
    );
  });

  it("publishPromptAction succeeds for super admin", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
    findByIdMock.mockResolvedValue({
      id: ACTOR_ID,
      email: "a@b.com",
      systemRoles: ["SUPER_ADMIN"],
    });
    publishGlobalPromptVersionMock.mockImplementation(async () => ({
      ok: true as const,
      version: 7,
    }));

    const r = await publishPromptAction({
      kind: "KISS",
      markdown: "# kiss",
      auditAction: "RESTORE_PROMPT",
    });
    expect(r).toEqual({ ok: true, version: 7 });
    expect(publishGlobalPromptVersionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isSuperAdmin: true,
        kind: "KISS",
        markdown: "# kiss",
        auditAction: "RESTORE_PROMPT",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/prompts");
  });
});
