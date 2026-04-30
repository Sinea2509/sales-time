import { redirect } from "next/navigation";
import { OrgSettingsShell } from "@/components/templates/org-settings-shell";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deps = getApplicationDeps();
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrgCookie,
    },
  );

  if (
    actor.kind !== "authenticated" ||
    !actor.activeOrganizationId ||
    !actor.canManageOrganization
  ) {
    redirect("/company");
  }

  return <OrgSettingsShell>{children}</OrgSettingsShell>;
}
