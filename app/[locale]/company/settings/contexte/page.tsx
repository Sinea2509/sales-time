import { OrgSettingsContexteForm } from "@/components/organisms/org-settings-contexte-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { requireOrgSettingsManager } from "@/lib/require-org-settings-manager";

export default async function OrganizationSettingsContextePage() {
  const access = await loadOrgSettingsAccess();
  if (!access) return null;
  requireOrgSettingsManager(access);

  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Contexte" />
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
