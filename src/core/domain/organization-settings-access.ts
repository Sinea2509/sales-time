import type { OrganizationMembershipRole } from "./organization-membership-role";

export function resolveEffectiveOrganizationSettingsAccess(input: {
  canManageOrganization: boolean;
  organizationMembershipRole: OrganizationMembershipRole | null;
  managerCount: number;
}): {
  canManageOrganizationSettings: boolean;
  organizationHasManager: boolean;
} {
  const organizationHasManager = input.managerCount > 0;

  if (input.canManageOrganization) {
    return {
      canManageOrganizationSettings: true,
      organizationHasManager,
    };
  }

  if (input.organizationMembershipRole === "MEMBER" && !organizationHasManager) {
    return {
      canManageOrganizationSettings: true,
      organizationHasManager,
    };
  }

  return {
    canManageOrganizationSettings: false,
    organizationHasManager,
  };
}
