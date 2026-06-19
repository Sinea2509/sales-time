import { OrgSettingsCoachForm } from "@/components/organisms/org-settings-coach-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { asStringArray } from "@/lib/as-string-array";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsCoachPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Coach IA" />
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsCoachForm
        canEdit={canEdit}
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
