import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const isAdmin = actor.workspaceRoleMode === "admin";
  const sellerScope =
    actor.workspaceRoleMode === "member"
      ? (actor.internalUserId ?? undefined)
      : undefined;

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    redirect("/company");
  }

  const [meetings, settings] = await Promise.all([
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      limit: 200,
      sellerUserId: sellerScope,
    }),
    deps.organizationSettings.findByOrganizationId(actor.activeOrganizationId),
  ]);

  const tamMinutesPerRdv = tamMinutesSavedPerMeetingFromSettings(settings);

  const rows = meetings.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    prospectCompany: m.prospectCompany,
    meetingAt: m.meetingAt.toISOString(),
    meetingType: m.meetingType,
    pipelineStage: m.pipelineStage,
    salesScore: m.salesScore,
    potentialAmount: m.potentialAmount,
  }));

  return (
    <div className="space-y-8">
      <PageHeaderSimple title={isAdmin ? "Rendez-vous" : "Mes rendez-vous"} />

      <RendezVousMeetingsShell
        meetings={rows}
        tamMinutesPerRdv={tamMinutesPerRdv}
      />
    </div>
  );
}
