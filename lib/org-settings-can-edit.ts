import type { OrgSettingsAccess } from "@/lib/load-org-settings-access";

export function orgSettingsCanEdit(access: OrgSettingsAccess): boolean {
  return access.canManageOrganizationSettings;
}
