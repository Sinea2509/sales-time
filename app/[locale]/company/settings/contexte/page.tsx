import { OrgSettingsContexteForm } from "@/components/organisms/org-settings-contexte-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsContextePage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Contexte" />
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsContexteForm
        canEdit={canEdit}
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
