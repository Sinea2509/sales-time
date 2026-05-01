import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";

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

  const [meetings, orgSettings] = await Promise.all([
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      limit: 200,
      sellerUserId: sellerScope,
    }),
    deps.organizationSettings.findByOrganizationId(actor.activeOrganizationId),
  ]);
  const tamMinutesPerRdv = tamMinutesSavedPerMeetingFromSettings(orgSettings);

  const rows = meetings.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    meetingAt: m.meetingAt.toISOString(),
    outcome: m.outcome,
    durationMin: m.durationMin,
    sellerEmail: m.sellerEmail,
    salesScore: m.salesScore,
    tamMinutesPerRdv,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitleClass}>
          {isAdmin ? "Rendez-vous" : "Mes rendez-vous"}
        </h1>
      </div>

      <RendezVousMeetingsShell meetings={rows} showSellerColumn={isAdmin} />
    </div>
  );
}
