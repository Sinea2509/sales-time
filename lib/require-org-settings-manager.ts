import { redirect } from "next/navigation";
import type { OrgSettingsAccess } from "@/lib/load-org-settings-access";

/** Redirects commercials away from manager-only organization settings pages. */
export function requireOrgSettingsManager(access: OrgSettingsAccess): void {
  if (!access.canManageOrganizationSettings) {
    redirect("/company/settings/email");
  }
}
