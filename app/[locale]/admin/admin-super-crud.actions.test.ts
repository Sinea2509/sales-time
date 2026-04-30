import { describe, it, expect, vi, beforeEach } from "vitest";

const revalidatePathMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  superAdminAuditLog: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
  systemRole: {
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
  superAdminInvitation: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  organizationInvitation: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const sendTransactionalEmailMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
vi.mock("@/lib/email/mailer", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

const generateOpaqueTokenMock = vi.hoisted(() => vi.fn(() => "raw-invite-token"));
const hashTokenMock = vi.hoisted(() => vi.fn(() => "hashed-token"));
vi.mock("@/lib/auth/tokens", () => ({
  generateOpaqueToken: generateOpaqueTokenMock,
  hashToken: hashTokenMock,
}));

const publishGlobalPromptVersionMock = vi.hoisted(() => vi.fn());
vi.mock("@/src/core/application/publish-global-prompt-version", () => ({
  publishGlobalPromptVersion: publishGlobalPromptVersionMock,
}));

const ACTOR_ID = "cjld2cjxh0000qzrmn831i7rn";
const OTHER_USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const ORG_ID = "clorg00000000000000000001";
const INVITE_ID = "clinv00000000000000000001";

const getAuthenticatedPrincipalMock = vi.hoisted(() => vi.fn());
const findByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/adapters/composition", () => ({
  makeApplicationDeps: () => ({
    auth: {
      getAuthenticatedPrincipal: getAuthenticatedPrincipalMock,
    },
    users: {
      findById: findByIdMock,
    },
  }),
}));

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

/** Principal is super admin; Prisma gate uses `user.findUnique` for `ACTOR_ID` only. */
function mockAuthenticatedSuperAdminPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
}

function prismaUserFindUniqueSuperAdminGate() {
  prismaMock.user.findUnique.mockImplementation(
    ({ where }: { where: { id: string } }) => {
      if (where.id === ACTOR_ID) {
        return Promise.resolve({ systemRoles: [{ role: "SUPER_ADMIN" }] });
      }
      return Promise.resolve(null);
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getAuthenticatedPrincipalMock.mockReset();
  findByIdMock.mockReset();
  publishGlobalPromptVersionMock.mockReset();
  publishGlobalPromptVersionMock.mockImplementation(async (_deps, input) => {
    if (!input.isSuperAdmin) {
      return { ok: false as const, error: "NOT_SUPER_ADMIN" as const };
    }
    return { ok: true as const, version: 99 };
  });
  for (const mod of Object.values(prismaMock)) {
    if (typeof mod === "object" && mod !== null) {
      for (const fn of Object.values(mod)) {
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset();
        }
      }
    }
  }
  sendTransactionalEmailMock.mockResolvedValue(undefined);
  prismaUserFindUniqueSuperAdminGate();
});

describe("admin super-admin CRUD — organizations", () => {
  it("rejects create when not authenticated", async () => {
    prismaMock.user.findUnique.mockReset();
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const r = await createOrganizationAction({ name: "Acme", slug: "acme" });
    expect(r).toEqual({ ok: false, message: "Non authentifié." });
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });

  it("creates organization and writes audit when super admin", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue(null);
    prismaMock.organization.create.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await createOrganizationAction({ name: "Acme", slug: "acme-new" });
    expect(r).toEqual({ ok: true });
    expect(prismaMock.organization.create).toHaveBeenCalledWith({
      data: { name: "Acme", slug: "acme-new" },
    });
    expect(prismaMock.superAdminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: ACTOR_ID,
          action: "CREATE_ORGANIZATION",
        }),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/organizations");
  });

  it("rejects create on duplicate slug", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue({ id: "x" });

    const r = await createOrganizationAction({ name: "Acme", slug: "taken" });
    expect(r).toEqual({ ok: false, message: "Ce slug est déjà utilisé." });
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });

  it("rejects update when slug belongs to another org", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Old",
      slug: "old-slug",
    });
    prismaMock.organization.findFirst.mockResolvedValue({ id: "other" });

    const r = await updateOrganizationAction({
      id: ORG_ID,
      name: "New",
      slug: "conflict-slug",
    });
    expect(r).toEqual({
      ok: false,
      message: "Ce slug est déjà utilisé par une autre organisation.",
    });
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
  });

  it("deletes organization and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Gone",
      slug: "gone",
    });
    prismaMock.organization.delete.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await deleteOrganizationAction(ORG_ID);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.organization.delete).toHaveBeenCalledWith({
      where: { id: ORG_ID },
    });
    expect(prismaMock.superAdminAuditLog.create).toHaveBeenCalled();
  });

  it("bulk delete writes audit per org", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findMany.mockResolvedValue([
      { id: "a", name: "A", slug: "a" },
      { id: "b", name: "B", slug: "b" },
    ]);
    prismaMock.organization.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.superAdminAuditLog.createMany.mockResolvedValue({ count: 2 });

    const r = await bulkDeleteOrganizationsAction(["a", "b"]);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.superAdminAuditLog.createMany).toHaveBeenCalled();
    expect(prismaMock.organization.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["a", "b"] } },
    });
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
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", email: "a@x.com" },
      { id: "u2", email: "b@x.com" },
    ]);
    prismaMock.user.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.superAdminAuditLog.createMany.mockResolvedValue({ count: 2 });

    const r = await bulkToggleUserStatusAction(["u1", "u2"], "DISABLED");
    expect(r).toEqual({ ok: true });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["u1", "u2"] } },
      data: { status: "DISABLED" },
    });
    expect(prismaMock.superAdminAuditLog.createMany).toHaveBeenCalled();
  });

  it("toggles user status and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === ACTOR_ID) {
          return Promise.resolve({ systemRoles: [{ role: "SUPER_ADMIN" }] });
        }
        if (where.id === OTHER_USER_ID) {
          return Promise.resolve({
            id: OTHER_USER_ID,
            status: "ACTIVE",
            email: "u@example.com",
          });
        }
        return Promise.resolve(null);
      },
    );
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await toggleUserStatusAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: OTHER_USER_ID },
      data: { status: "DISABLED" },
    });
    expect(prismaMock.superAdminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "BLOCK_USER" }),
      }),
    );
  });

  it("rejects update user when email taken", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === ACTOR_ID) {
          return Promise.resolve({ systemRoles: [{ role: "SUPER_ADMIN" }] });
        }
        if (where.id === OTHER_USER_ID) {
          return Promise.resolve({
            id: OTHER_USER_ID,
            email: "old@example.com",
          });
        }
        return Promise.resolve(null);
      },
    );
    prismaMock.user.findFirst.mockResolvedValue({ id: "someone-else" });

    const r = await updateUserAction({
      id: OTHER_USER_ID,
      firstName: "A",
      lastName: "B",
      email: "taken@example.com",
    });
    expect(r).toEqual({ ok: false, message: "Cet e-mail est déjà utilisé." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates user profile and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === ACTOR_ID) {
          return Promise.resolve({ systemRoles: [{ role: "SUPER_ADMIN" }] });
        }
        if (where.id === OTHER_USER_ID) {
          return Promise.resolve({
            id: OTHER_USER_ID,
            email: "old@example.com",
          });
        }
        return Promise.resolve(null);
      },
    );
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await updateUserAction({
      id: OTHER_USER_ID,
      firstName: "Ann",
      lastName: "Lee",
      email: "new@example.com",
    });
    expect(r).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: OTHER_USER_ID },
      data: {
        firstName: "Ann",
        lastName: "Lee",
        email: "new@example.com",
      },
    });
  });

  it("deletes user and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === ACTOR_ID) {
          return Promise.resolve({ systemRoles: [{ role: "SUPER_ADMIN" }] });
        }
        if (where.id === OTHER_USER_ID) {
          return Promise.resolve({
            id: OTHER_USER_ID,
            email: "gone@example.com",
          });
        }
        return Promise.resolve(null);
      },
    );
    prismaMock.user.delete.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await deleteUserAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: OTHER_USER_ID },
    });
  });

  it("invites user to org when valid", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Org",
    });
    prismaMock.organizationInvitation.findFirst.mockResolvedValue(null);
    prismaMock.organizationInvitation.create.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await inviteUserToOrgAction({
      email: "join@example.com",
      organizationId: ORG_ID,
      role: "MEMBER",
    });
    expect(r).toEqual({ ok: true });
    expect(prismaMock.organizationInvitation.create).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
    expect(prismaMock.superAdminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "INVITE_USER_TO_ORG" }),
      }),
    );
  });

  it("rejects org invite when org missing", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.organization.findUnique.mockResolvedValue(null);

    const r = await inviteUserToOrgAction({
      email: "join@example.com",
      organizationId: ORG_ID,
      role: "ADMIN",
    });
    expect(r).toEqual({ ok: false, message: "Organisation introuvable." });
    expect(prismaMock.organizationInvitation.create).not.toHaveBeenCalled();
  });
});

describe("admin super-admin — super-admins & prompts", () => {
  it("inviteSuperAdmin rejects when user already super admin", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "existing" });

    const r = await inviteSuperAdminAction({ email: "boss@example.com" });
    expect(r).toEqual({
      ok: false,
      message: "Cet utilisateur est déjà super administrateur.",
    });
    expect(prismaMock.superAdminInvitation.create).not.toHaveBeenCalled();
  });

  it("inviteSuperAdmin creates pending invitation and sends email", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.superAdminInvitation.findFirst.mockResolvedValue(null);
    prismaMock.superAdminInvitation.create.mockResolvedValue({});

    const r = await inviteSuperAdminAction({ email: "newadmin@example.com" });
    expect(r).toEqual({ ok: true });
    expect(prismaMock.superAdminInvitation.create).toHaveBeenCalled();
    expect(sendTransactionalEmailMock).toHaveBeenCalled();
  });

  it("revokeSuperAdminInvitation rejects invalid id", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await revokeSuperAdminInvitationAction("not-a-cuid");
    expect(r).toEqual({ ok: false, message: "Identifiant invalide." });
  });

  it("revokeSuperAdminInvitation revokes pending invite", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.superAdminInvitation.findFirst.mockResolvedValue({
      id: INVITE_ID,
      status: "PENDING",
    });
    prismaMock.superAdminInvitation.update.mockResolvedValue({});

    const r = await revokeSuperAdminInvitationAction(INVITE_ID);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.superAdminInvitation.update).toHaveBeenCalledWith({
      where: { id: INVITE_ID },
      data: { status: "REVOKED" },
    });
  });

  it("revokeSuperAdminRole rejects self-revoke", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const r = await revokeSuperAdminRoleAction(ACTOR_ID);
    expect(r).toEqual({
      ok: false,
      message: "Vous ne pouvez pas révoquer votre propre rôle.",
    });
    expect(prismaMock.systemRole.delete).not.toHaveBeenCalled();
  });

  it("revokeSuperAdminRole deletes role and audits", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    prismaMock.systemRole.findFirst.mockResolvedValue({
      id: "role-row-id",
      userId: OTHER_USER_ID,
      role: "SUPER_ADMIN",
      user: { email: "target@example.com" },
    });
    prismaMock.systemRole.delete.mockResolvedValue({});
    prismaMock.superAdminAuditLog.create.mockResolvedValue({});

    const r = await revokeSuperAdminRoleAction(OTHER_USER_ID);
    expect(r).toEqual({ ok: true });
    expect(prismaMock.systemRole.delete).toHaveBeenCalledWith({
      where: { id: "role-row-id" },
    });
    expect(prismaMock.superAdminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "REVOKE_SUPER_ADMIN" }),
      }),
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
