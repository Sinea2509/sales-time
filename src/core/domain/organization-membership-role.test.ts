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
});
