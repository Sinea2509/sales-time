import { redirect } from "next/navigation";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";

export default async function OrganizationSettingsIndexPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) {
    redirect("/company");
  }

  if (access.canManageOrganizationSettings) {
    redirect("/company/settings/contexte");
  }

  redirect("/company/settings/email");
}
