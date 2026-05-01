import { OrgSettingsCoachForm } from "@/components/organisms/org-settings-coach-form";
import { asStringArray } from "@/lib/as-string-array";
import { pageTitleClass } from "@/lib/page-typography";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsCoachPage() {
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
      <h1 className={pageTitleClass}>Coach IA</h1>
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
