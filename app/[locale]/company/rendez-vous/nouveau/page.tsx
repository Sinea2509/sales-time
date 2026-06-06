import { redirect } from "next/navigation";
import { MeetingCreatePageShell } from "@/components/organisms/meeting-create-page-shell";
import { stringArrayFromOrgJson } from "@/lib/org-settings-json";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function NouveauRendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const settings = await deps.organizationSettings.findByOrganizationId(
    actor.activeOrganizationId,
  );
  const meetingTypeOptions = stringArrayFromOrgJson(settings?.meetingTypes, [
    "Découverte",
    "Démo",
    "Proposition",
    "Négociation",
  ]);
  const pipelineStageOptions = stringArrayFromOrgJson(
    settings?.pipelineStages,
    ["Lead", "Qualifié", "Proposition", "Gagné"],
  );

  return (
    <MeetingCreatePageShell
      meetingTypeOptions={meetingTypeOptions}
      pipelineStageOptions={pipelineStageOptions}
    />
  );
}
