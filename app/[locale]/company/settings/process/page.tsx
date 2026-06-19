import { OrgSettingsProcessForm } from "@/components/organisms/org-settings-process-form";
import { asStringArray } from "@/lib/as-string-array";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { OrgSettingsReadOnlyBanner } from "@/components/molecules/org-settings-read-only-banner";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { orgSettingsCanEdit } from "@/lib/org-settings-can-edit";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsProcessPage() {
  const access = await loadOrgSettingsAccess();
  if (!access) redirect("/company");

  const canEdit = orgSettingsCanEdit(access);
  const orgId = access.actor.activeOrganizationId!;
  const deps = getApplicationDeps();
  const row = await deps.organizationSettings.findByOrganizationId(orgId);

  const meetingTypesRaw = asStringArray(row?.meetingTypes);
  const pipelineStagesRaw = asStringArray(row?.pipelineStages);

  return (
    <div className="space-y-6">
      <PageHeaderSimple title="Process" />
      {!canEdit ? <OrgSettingsReadOnlyBanner /> : null}
      <OrgSettingsProcessForm
        canEdit={canEdit}
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
