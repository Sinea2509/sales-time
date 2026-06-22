import {
  organizationMembershipRoleLabel,
  type OrganizationMembershipRole,
} from "./organization-membership-role";

describe("organizationMembershipRoleLabel", () => {
  it.each<[OrganizationMembershipRole, string]>([
    ["ADMIN", "Manager"],
    ["MEMBER", "Commercial"],
  ])("maps %s to %s", (role, label) => {
    expect(organizationMembershipRoleLabel(role)).toBe(label);
  });

  it("throws on impossible role at compile-time guard", () => {
    expect(
      organizationMembershipRoleLabel(
        "UNKNOWN" as unknown as OrganizationMembershipRole,
      ),
    ).toBe("UNKNOWN");
  });
});
