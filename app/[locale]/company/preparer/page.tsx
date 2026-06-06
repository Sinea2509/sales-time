import { redirect } from "next/navigation";
import { PrepareMeetingBriefingForm } from "@/components/organisms/prepare-meeting-briefing-form";
import { pageTitleClass } from "@/lib/page-typography";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import { stringArrayFromOrgJson } from "@/lib/org-settings-json";

export const dynamic = "force-dynamic";

export default async function PreparerRdvPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const settings = await getApplicationDeps().organizationSettings.findByOrganizationId(
    actor.activeOrganizationId,
  );
  const pipelineStageOptions = stringArrayFromOrgJson(settings?.pipelineStages, [
    "Lead",
    "Qualifié",
    "Proposition",
    "Gagné",
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Préparer un RDV</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Synthèse de l&apos;historique prospect, profils DISC/SONCAS et conseils
          pour la prochaine étape.
        </p>
      </div>
      <PrepareMeetingBriefingForm pipelineStageOptions={pipelineStageOptions} />
    </div>
  );
}
