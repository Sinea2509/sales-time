import { OrgSettingsContexteForm } from "@/components/org-settings/org-settings-contexte-form";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsContextePage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });
  const orgId =
    actor.kind === "authenticated" ? actor.activeTenantClerkOrgId : null;

  const row =
    orgId != null
      ? await prisma.organizationSettings.findUnique({
          where: { clerkOrgId: orgId },
        })
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contexte</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Informations commerciales de référence pour votre organisation.
        </p>
      </div>
      <OrgSettingsContexteForm
        initial={{
          companyName: row?.companyName ?? "",
          industrySector: row?.industrySector ?? "",
          commercialTeamSize: row?.commercialTeamSize ?? "",
          averageSalesCycle: row?.averageSalesCycle ?? "",
          averageDealSize: row?.averageDealSize ?? "",
        }}
      />
    </div>
  );
}
