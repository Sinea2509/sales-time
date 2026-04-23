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
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });

  if (
    actor.kind !== "authenticated" ||
    !actor.activeTenantClerkOrgId ||
    !actor.canManageOrganization
  ) {
    redirect("/dashboard");
  }

  return <OrgSettingsShell>{children}</OrgSettingsShell>;
}
