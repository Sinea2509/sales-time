import { redirect } from "next/navigation";
import { PrepareMeetingBriefingForm } from "@/components/organisms/prepare-meeting-briefing-form";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import { followUpMeetingTypes } from "@/lib/follow-up-meeting-types";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";

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
  /*
    Les types de rendez-vous de l'organisation, moins ceux d'un premier
    contact : on prépare ici un rendez-vous de suivi avec un prospect déjà
    rencontré.
  */
  const meetingTypeOptions = followUpMeetingTypes(
    orgMeetingFormOptionsFromSettings(settings).meetingTypeOptions,
  );

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="Préparer un rendez-vous"
        description="Le briefing reprend l'historique du prospect, les profils déjà connus, et le playbook de l'organisation."
      />
      <PrepareMeetingBriefingForm meetingTypeOptions={meetingTypeOptions} />
    </div>
  );
}
