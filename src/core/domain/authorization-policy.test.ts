import { describe, expect, it } from "@jest/globals";
import {
  resolveActorAuthorization,
  resolveWorkspaceRoleMode,
} from "./authorization-policy";

describe("resolveActorAuthorization", () => {
  it("grants org admin when membership role is ADMIN for active org", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: "org_1",
      superAdminElevatedOrganizationId: null,
      memberships: [{ organizationId: "org_1", role: "ADMIN" }],
      isSuperAdmin: false,
    });
    expect(r.activeOrganizationId).toBe("org_1");
    expect(r.canManageOrganization).toBe(true);
    expect(r.isElevatedSuperAdmin).toBe(false);
  });

  it("denies manage for org member", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: "org_1",
      superAdminElevatedOrganizationId: null,
      memberships: [{ organizationId: "org_1", role: "MEMBER" }],
      isSuperAdmin: false,
    });
    expect(r.canManageOrganization).toBe(false);
  });

  it("elevates super admin when cookie org is set", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: "org_other",
      superAdminElevatedOrganizationId: "org_target",
      memberships: [{ organizationId: "org_other", role: "MEMBER" }],
      isSuperAdmin: true,
    });
    expect(r.activeOrganizationId).toBe("org_target");
    expect(r.isElevatedSuperAdmin).toBe(true);
    expect(r.canManageOrganization).toBe(true);
  });

  it("does not elevate super admin without cookie", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: "org_1",
      superAdminElevatedOrganizationId: null,
      memberships: [{ organizationId: "org_1", role: "MEMBER" }],
      isSuperAdmin: true,
    });
    expect(r.activeOrganizationId).toBe("org_1");
    expect(r.isElevatedSuperAdmin).toBe(false);
    expect(r.canManageOrganization).toBe(false);
  });

  it("uses session org when super admin cookie matches session org", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: "org_same",
      superAdminElevatedOrganizationId: "org_same",
      memberships: [{ organizationId: "org_same", role: "ADMIN" }],
      isSuperAdmin: true,
    });
    expect(r.activeOrganizationId).toBe("org_same");
    expect(r.isElevatedSuperAdmin).toBe(true);
    expect(r.canManageOrganization).toBe(true);
  });

  it("returns no tenant when session has no org and no elevation cookie", () => {
    const r = resolveActorAuthorization({
      sessionActiveOrganizationId: null,
      superAdminElevatedOrganizationId: null,
      memberships: [],
      isSuperAdmin: true,
    });
    expect(r.activeOrganizationId).toBeNull();
    expect(r.canManageOrganization).toBe(false);
    expect(r.isElevatedSuperAdmin).toBe(false);
  });
});

describe("resolveWorkspaceRoleMode", () => {
  it("returns null when no tenant org", () => {
    expect(
      resolveWorkspaceRoleMode({
        activeOrganizationId: null,
        canManageOrganization: true,
      }),
    ).toBeNull();
  });

  it("returns admin when tenant active and can manage", () => {
    expect(
      resolveWorkspaceRoleMode({
        activeOrganizationId: "org_1",
        canManageOrganization: true,
      }),
    ).toBe("admin");
  });

  it("returns member when tenant active but cannot manage", () => {
    expect(
      resolveWorkspaceRoleMode({
        activeOrganizationId: "org_1",
        canManageOrganization: false,
      }),
    ).toBe("member");
  });
});
