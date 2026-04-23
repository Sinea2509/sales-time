import { OrgSettingsProcessForm } from "@/components/org-settings/org-settings-process-form";
import { asStringArray } from "@/lib/as-string-array";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export default async function OrganizationSettingsProcessPage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });
  const orgId =
    actor.kind === "authenticated" ? actor.activeTenantClerkOrgId : null;

  const row =
    orgId != null
      ? await prisma.organizationSettings.findUnique({
          where: { clerkOrgId: orgId },
        })
      : null;

  const meetingTypesRaw = asStringArray(row?.meetingTypes);
  const pipelineStagesRaw = asStringArray(row?.pipelineStages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Process</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Types de rendez-vous et étapes du pipeline — une valeur par ligne.
        </p>
      </div>
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
