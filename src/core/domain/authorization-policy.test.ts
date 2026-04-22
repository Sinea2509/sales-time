import { describe, expect, it } from "vitest";
import { resolveActorAuthorization } from "./authorization-policy";

describe("resolveActorAuthorization", () => {
  it("grants org admin when session role is org:admin for session org", () => {
    const r = resolveActorAuthorization({
      sessionClerkOrgId: "org_1",
      sessionClerkOrgRole: "org:admin",
      isSuperAdmin: false,
      superAdminActiveClerkOrgId: null,
    });
    expect(r.activeTenantClerkOrgId).toBe("org_1");
    expect(r.canManageOrganization).toBe(true);
    expect(r.isElevatedSuperAdmin).toBe(false);
  });

  it("denies manage for org member", () => {
    const r = resolveActorAuthorization({
      sessionClerkOrgId: "org_1",
      sessionClerkOrgRole: "org:member",
      isSuperAdmin: false,
      superAdminActiveClerkOrgId: null,
    });
    expect(r.canManageOrganization).toBe(false);
  });

  it("elevates super admin when cookie org is set", () => {
    const r = resolveActorAuthorization({
      sessionClerkOrgId: "org_other",
      sessionClerkOrgRole: "org:member",
      isSuperAdmin: true,
      superAdminActiveClerkOrgId: "org_target",
    });
    expect(r.activeTenantClerkOrgId).toBe("org_target");
    expect(r.isElevatedSuperAdmin).toBe(true);
    expect(r.canManageOrganization).toBe(true);
  });

  it("does not elevate super admin without cookie", () => {
    const r = resolveActorAuthorization({
      sessionClerkOrgId: "org_1",
      sessionClerkOrgRole: "org:member",
      isSuperAdmin: true,
      superAdminActiveClerkOrgId: null,
    });
    expect(r.activeTenantClerkOrgId).toBe("org_1");
    expect(r.isElevatedSuperAdmin).toBe(false);
    expect(r.canManageOrganization).toBe(false);
  });
});
