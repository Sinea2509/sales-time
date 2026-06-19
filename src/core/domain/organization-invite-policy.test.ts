import { describe, expect, it } from "@jest/globals";
import { resolveOrganizationInviteRole } from "./organization-invite-policy";

describe("resolveOrganizationInviteRole", () => {
  it("allows managers to invite any role", () => {
    expect(
      resolveOrganizationInviteRole({
        actorRole: "ADMIN",
        requestedRole: "MEMBER",
      }),
    ).toBe("MEMBER");
    expect(
      resolveOrganizationInviteRole({
        actorRole: "ADMIN",
        requestedRole: "ADMIN",
      }),
    ).toBe("ADMIN");
  });

  it("allows commercials to invite only commercials", () => {
    expect(
      resolveOrganizationInviteRole({
        actorRole: "MEMBER",
        requestedRole: "MEMBER",
      }),
    ).toBe("MEMBER");
    expect(
      resolveOrganizationInviteRole({
        actorRole: "MEMBER",
        requestedRole: "ADMIN",
      }),
    ).toBeNull();
  });
});
