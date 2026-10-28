import { redirect } from "next/navigation";
import { PrepareMeetingModes } from "@/components/organisms/prepare-meeting-modes";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import { stringArrayFromOrgJson } from "@/lib/org-settings-json";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/onboarding-defaults";

export const dynamic = "force-dynamic";

export default async function PreparerRdvPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const settings =
    await getApplicationDeps().organizationSettings.findByOrganizationId(
      actor.activeOrganizationId,
    );
  // Le même repli que l'onboarding et les réglages : un commercial dont
  // l'organisation n'a rien configuré doit voir le pipeline par défaut du
  // produit, pas une liste d'étapes écrite ici et nulle part ailleurs.
  const pipelineStageOptions = stringArrayFromOrgJson(
    settings?.pipelineStages,
    [...DEFAULT_PIPELINE_STAGES],
  );

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Préparer un RDV"
        description="Un nouveau prospect : le web en munitions commerciales. Un prospect déjà rencontré : ce que vos rendez-vous ont appris."
      />
      <PrepareMeetingModes pipelineStageOptions={pipelineStageOptions} />
    </div>
  );
}
