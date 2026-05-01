import { OrgSettingsContexteForm } from "@/components/organisms/org-settings-contexte-form";
import { pageTitleClass } from "@/lib/page-typography";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsContextePage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrgCookie,
    },
  );
  const orgId =
    actor.kind === "authenticated" ? actor.activeOrganizationId : null;

  const row =
    orgId != null
      ? await deps.organizationSettings.findByOrganizationId(orgId)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Contexte</h1>
      </div>
      <OrgSettingsContexteForm
        initialLogoUrl={row?.logoUrl ?? null}
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
