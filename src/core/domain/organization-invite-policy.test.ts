import { describe, expect, it } from "@jest/globals";
import { resolveOrganizationInviteRole } from "./organization-invite-policy";

describe("resolveOrganizationInviteRole", () => {
  it("allows managers to invite any role", () => {
    expect(
      resolveOrganizationInviteRole({
        actorRole: "ADMIN",
        requestedRole: "MEMBER",
        organizationHasManager: true,
      }),
    ).toBe("MEMBER");
    expect(
      resolveOrganizationInviteRole({
        actorRole: "ADMIN",
        requestedRole: "ADMIN",
        organizationHasManager: true,
      }),
    ).toBe("ADMIN");
  });

  it("allows commercials to invite only commercials when a manager exists", () => {
    expect(
      resolveOrganizationInviteRole({
        actorRole: "MEMBER",
        requestedRole: "MEMBER",
        organizationHasManager: true,
      }),
    ).toBe("MEMBER");
    expect(
      resolveOrganizationInviteRole({
        actorRole: "MEMBER",
        requestedRole: "ADMIN",
        organizationHasManager: true,
      }),
    ).toBeNull();
  });

  it("allows commercials to invite any role when no manager exists", () => {
    expect(
      resolveOrganizationInviteRole({
        actorRole: "MEMBER",
        requestedRole: "ADMIN",
        organizationHasManager: false,
      }),
    ).toBe("ADMIN");
  });
});
