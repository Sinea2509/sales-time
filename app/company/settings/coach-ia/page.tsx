import { OrgSettingsCoachForm } from "@/components/org-settings/org-settings-coach-form";
import { asStringArray } from "@/lib/as-string-array";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsCoachPage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const deps = makeApplicationDeps();
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
        <h1 className="text-2xl font-semibold tracking-tight">Coach IA</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Contenus utilisés pour contextualiser le coach IA au niveau de
          l’organisation.
        </p>
      </div>
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
