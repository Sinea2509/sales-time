import { redirect } from "next/navigation";
import { OrgSettingsShell } from "@/components/templates/org-settings-shell";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";

export default async function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await loadOrgSettingsAccess();
  if (!access) {
    redirect("/company");
  }

  return <OrgSettingsShell>{children}</OrgSettingsShell>;
}
