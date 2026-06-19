import { describe, expect, it } from "@jest/globals";
import {
  buildFeedbackSubmitContextExtra,
  formatFeedbackUserRoleLabel,
} from "./feedback-submit-context";
import type { ActorContext } from "./actor-context";

function authenticatedActor(
  over: Partial<Extract<ActorContext, { kind: "authenticated" }>> = {},
): ActorContext {
  return {
    kind: "authenticated",
    userId: "user_1",
    internalUserId: "user_1",
    email: "user@example.com",
    firstName: null,
    lastName: null,
    sessionOrganizationId: "org_1",
    organizationMembershipRole: "MEMBER",
    activeOrganizationId: "org_1",
    systemRoles: [],
    superAdminElevatedOrganizationId: null,
    superAdminElevatedRole: null,
    canManageOrganization: false,
    canAccessOrganizationSettings: false,
    isElevatedSuperAdmin: false,
    workspaceRoleMode: "member",
    ...over,
  };
}

describe("buildFeedbackSubmitContextExtra", () => {
  it("returns null for guests", () => {
    expect(buildFeedbackSubmitContextExtra({ kind: "guest" })).toBeNull();
  });

  it("captures organization and role context for authenticated users", () => {
    expect(buildFeedbackSubmitContextExtra(authenticatedActor())).toEqual({
      organizationId: "org_1",
      workspaceRoleMode: "member",
      organizationMembershipRole: "MEMBER",
      systemRoles: [],
    });
  });
});

describe("formatFeedbackUserRoleLabel", () => {
  it("formats commercial role", () => {
    expect(
      formatFeedbackUserRoleLabel({
        organizationMembershipRole: "MEMBER",
        workspaceRoleMode: "member",
        systemRoles: [],
        organizationId: "org_1",
      }),
    ).toBe("Commercial");
  });

  it("includes super admin when applicable", () => {
    expect(
      formatFeedbackUserRoleLabel({
        organizationMembershipRole: "ADMIN",
        workspaceRoleMode: "admin",
        systemRoles: ["SUPER_ADMIN"],
        organizationId: "org_1",
      }),
    ).toBe("Super admin · Manager");
  });

  it("returns null for unknown extra payloads", () => {
    expect(formatFeedbackUserRoleLabel({ route: "/company" })).toBeNull();
  });
});
