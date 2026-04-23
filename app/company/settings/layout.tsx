import { redirect } from "next/navigation";
import { OrgSettingsShell } from "@/components/templates/org-settings-shell";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deps = makeApplicationDeps();
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
