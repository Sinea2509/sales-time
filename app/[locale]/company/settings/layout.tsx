import { redirect } from "next/navigation";
import { OrgSettingsShell } from "@/components/templates/org-settings-shell";
import { getApplicationDeps } from "@/lib/application-deps";
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

  const orgId = access.actor.activeOrganizationId!;
  const row = await getApplicationDeps()
    .organizationSettings.findByOrganizationId(orgId)
    .catch(() => null);

  return (
    <OrgSettingsShell organizationName={row?.companyName ?? null}>
      {children}
    </OrgSettingsShell>
  );
}
