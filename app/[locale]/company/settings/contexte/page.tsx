import { OrgSettingsContexteForm } from "@/components/organisms/org-settings-contexte-form";
import { OrgSettingsLogoForm } from "@/components/organisms/org-settings-logo-form";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsContextePage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext({ auth: deps.auth }, {
    superAdminElevatedOrganizationId: superAdminOrgCookie,
  });
  const orgId =
    actor.kind === "authenticated" ? actor.activeOrganizationId : null;

  const row =
    orgId != null
      ? await deps.organizationSettings.findByOrganizationId(orgId)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contexte</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Informations commerciales de référence pour votre organisation.
        </p>
      </div>
      <OrgSettingsLogoForm initialLogoUrl={row?.logoUrl ?? null} />
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
