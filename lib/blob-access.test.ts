import { describe, expect, it } from "@jest/globals";
import { canAccessBlobUrl, canAccessOrgBlob } from "@/lib/blob-access";
import type { ActorContext } from "@/src/core/domain/actor-context";

const memberCtx: Extract<ActorContext, { kind: "authenticated" }> = {
  kind: "authenticated",
  userId: "u1",
  internalUserId: "u1",
  email: "a@example.com",
  firstName: null,
  lastName: null,
  sessionOrganizationId: "org_a",
  organizationMembershipRole: "MEMBER",
  activeOrganizationId: "org_a",
  systemRoles: [],
  superAdminElevatedOrganizationId: null,
  superAdminElevatedRole: null,
  canManageOrganization: false,
  canAccessOrganizationSettings: false,
  isElevatedSuperAdmin: false,
  workspaceRoleMode: "member",
};

describe("canAccessOrgBlob", () => {
  it("allows super admins across orgs", () => {
    expect(
      canAccessOrgBlob({
        ctx: { ...memberCtx, systemRoles: ["SUPER_ADMIN"] },
        orgIdFromPath: "org_b",
        scope: "member-org",
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(true);
  });

  it("allows members of the target org", () => {
    expect(
      canAccessOrgBlob({
        ctx: memberCtx,
        orgIdFromPath: "org_b",
        scope: "member-org",
        membershipOrganizationIds: ["org_a", "org_b"],
      }),
    ).toBe(true);
  });

  it("denies access to other org blobs", () => {
    expect(
      canAccessOrgBlob({
        ctx: memberCtx,
        orgIdFromPath: "org_b",
        scope: "member-org",
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(false);
  });

  it("enforces active org for active-org scope", () => {
    expect(
      canAccessOrgBlob({
        ctx: memberCtx,
        orgIdFromPath: "org_b",
        scope: "active-org",
        membershipOrganizationIds: ["org_a", "org_b"],
      }),
    ).toBe(false);
  });
});

describe("canAccessBlobUrl", () => {
  it("allows super admins to read legacy unscoped feedback blobs", () => {
    expect(
      canAccessBlobUrl({
        ctx: { ...memberCtx, systemRoles: ["SUPER_ADMIN"] },
        pathname: "feedbacks/123.png",
        orgIdFromPath: null,
        userIdFromPath: null,
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(true);
  });

  it("denies regular users legacy unscoped blobs", () => {
    expect(
      canAccessBlobUrl({
        ctx: memberCtx,
        pathname: "feedbacks/123.png",
        orgIdFromPath: null,
        userIdFromPath: null,
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(false);
  });

  it("allows users to read their own avatar", () => {
    expect(
      canAccessBlobUrl({
        ctx: { ...memberCtx, userId: "u1", internalUserId: "u1" },
        pathname: "users/u1/avatars/a.png",
        orgIdFromPath: null,
        userIdFromPath: "u1",
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(true);
  });

  it("denies access to another user's avatar", () => {
    expect(
      canAccessBlobUrl({
        ctx: memberCtx,
        pathname: "users/u2/avatars/a.png",
        orgIdFromPath: null,
        userIdFromPath: "u2",
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(false);
  });

  it("allows super admins to read any org-scoped blob", () => {
    expect(
      canAccessBlobUrl({
        ctx: { ...memberCtx, systemRoles: ["SUPER_ADMIN"] },
        pathname: "orgs/org_z/logos/logo.png",
        orgIdFromPath: "org_z",
        userIdFromPath: null,
        membershipOrganizationIds: ["org_a"],
      }),
    ).toBe(true);
  });
});
