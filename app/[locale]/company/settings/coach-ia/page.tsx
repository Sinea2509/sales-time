import { OrgSettingsCoachForm } from "@/components/organisms/org-settings-coach-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { asStringArray } from "@/lib/as-string-array";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { requireOrgSettingsManager } from "@/lib/require-org-settings-manager";

export default async function OrganizationSettingsCoachPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) return null;
  requireOrgSettingsManager(access);

  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Coach IA" />
      <OrgSettingsCoachForm
        initial={{
          companyPitch: row?.companyPitch ?? "",
          objections: asStringArray(row?.objections),
          keyArguments: asStringArray(row?.keyArguments),
          industryVocabulary: row?.industryVocabulary ?? "",
        }}
      />
    </div>
  );
}
