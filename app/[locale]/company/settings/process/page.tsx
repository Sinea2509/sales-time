import { OrgSettingsProcessForm } from "@/components/organisms/org-settings-process-form";
import { asStringArray } from "@/lib/as-string-array";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsProcessPage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevation: superAdminOrgCookie,
    },
  );
  const orgId =
    actor.kind === "authenticated" ? actor.activeOrganizationId : null;

  const row =
    orgId != null
      ? await deps.organizationSettings.findByOrganizationId(orgId)
      : null;

  const meetingTypesRaw = asStringArray(row?.meetingTypes);
  const pipelineStagesRaw = asStringArray(row?.pipelineStages);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Process" />
      <OrgSettingsProcessForm
        initial={{
          meetingTypes:
            meetingTypesRaw.length > 0
              ? meetingTypesRaw
              : [...DEFAULT_MEETING_TYPES],
          pipelineStages:
            pipelineStagesRaw.length > 0
              ? pipelineStagesRaw
              : [...DEFAULT_PIPELINE_STAGES],
        }}
      />
    </div>
  );
}
