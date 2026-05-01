import { describe, expect, it } from "@jest/globals";
import { enterOrganizationAsSuperAdmin } from "./enter-organization-as-super-admin";

describe("enterOrganizationAsSuperAdmin", () => {
  it("returns NOT_AUTHENTICATED when there is no session principal", async () => {
    const auth = {
      getAuthenticatedPrincipal: jest.fn().mockResolvedValue(null),
    };
    const orgDirectory = {
      getOrganizationById: jest.fn(),
      listOrganizations: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, audit, orgDirectory },
      { targetOrganizationId: "org_1" },
    );

    expect(result).toEqual({ ok: false, error: "NOT_AUTHENTICATED" });
    expect(audit.logSuperAdminAction).not.toHaveBeenCalled();
  });

  it("returns NOT_SUPER_ADMIN when user lacks system role", async () => {
    const auth = {
      getAuthenticatedPrincipal: jest.fn().mockResolvedValue({
        sessionId: "s1",
        userId: "u1",
        email: "a@b.c",
        firstName: null,
        lastName: null,
        registerProfileCompletedAt: new Date(),
        systemRoles: [],
        memberships: [],
        activeOrganizationIdFromCookie: null,
      }),
    };
    const orgDirectory = {
      getOrganizationById: jest.fn().mockResolvedValue({
        id: "org_1",
        name: "X",
        slug: "x",
        logoUrl: null,
      }),
      listOrganizations: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, audit, orgDirectory },
      { targetOrganizationId: "org_1" },
    );

    expect(result).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
    expect(audit.logSuperAdminAction).not.toHaveBeenCalled();
  });

  it("returns ORG_NOT_FOUND when organization does not exist", async () => {
    const auth = {
      getAuthenticatedPrincipal: jest.fn().mockResolvedValue({
        sessionId: "s1",
        userId: "u1",
        email: "a@b.c",
        firstName: null,
        lastName: null,
        registerProfileCompletedAt: new Date(),
        systemRoles: ["SUPER_ADMIN"],
        memberships: [],
        activeOrganizationIdFromCookie: null,
      }),
    };
    const orgDirectory = {
      getOrganizationById: jest.fn().mockResolvedValue(null),
      listOrganizations: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, audit, orgDirectory },
      { targetOrganizationId: "missing" },
    );

    expect(result).toEqual({ ok: false, error: "ORG_NOT_FOUND" });
    expect(audit.logSuperAdminAction).not.toHaveBeenCalled();
  });

  it("writes audit log when super admin enters org", async () => {
    const auth = {
      getAuthenticatedPrincipal: jest.fn().mockResolvedValue({
        sessionId: "s1",
        userId: "int_1",
        email: "a@b.c",
        firstName: null,
        lastName: null,
        registerProfileCompletedAt: new Date(),
        systemRoles: ["SUPER_ADMIN"],
        memberships: [],
        activeOrganizationIdFromCookie: null,
      }),
    };
    const orgDirectory = {
      getOrganizationById: jest.fn().mockResolvedValue({
        id: "org_2",
        name: "Acme",
        slug: "acme",
        logoUrl: null,
      }),
      listOrganizations: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, audit, orgDirectory },
      { targetOrganizationId: "org_2", reason: "INC-42" },
    );

    expect(result).toEqual({ ok: true });
    expect(audit.logSuperAdminAction).toHaveBeenCalledWith({
      actorInternalUserId: "int_1",
      organizationId: "org_2",
      action: "ENTER_ORG",
      reason: "INC-42",
    });
  });
});
