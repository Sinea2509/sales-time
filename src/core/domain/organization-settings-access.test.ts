import { describe, expect, it } from "@jest/globals";
import { resolveEffectiveOrganizationSettingsAccess } from "./organization-settings-access";

describe("resolveEffectiveOrganizationSettingsAccess", () => {
  it("grants managers full org settings access regardless of manager count", () => {
    expect(
      resolveEffectiveOrganizationSettingsAccess({
        canManageOrganization: true,
        organizationMembershipRole: "ADMIN",
        managerCount: 2,
      }),
    ).toEqual({
      canManageOrganizationSettings: true,
      organizationHasManager: true,
    });
  });

  it("locks org settings for commercials when a manager exists", () => {
    expect(
      resolveEffectiveOrganizationSettingsAccess({
        canManageOrganization: false,
        organizationMembershipRole: "MEMBER",
        managerCount: 1,
      }),
    ).toEqual({
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });
  });

  it("grants org settings access to commercials when no manager exists", () => {
    expect(
      resolveEffectiveOrganizationSettingsAccess({
        canManageOrganization: false,
        organizationMembershipRole: "MEMBER",
        managerCount: 0,
      }),
    ).toEqual({
      canManageOrganizationSettings: true,
      organizationHasManager: false,
    });
  });
});
