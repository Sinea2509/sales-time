import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/src/core/domain/dashboard-estimates";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";

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

  const meetings = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: actor.activeOrganizationId,
    limit: 200,
    sellerUserId: sellerScope,
  });

  const rows = meetings.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    meetingAt: m.meetingAt.toISOString(),
    outcome: m.outcome,
    durationMin: m.durationMin,
    sellerEmail: m.sellerEmail,
    salesScore: m.salesScore,
    potentialEur: ESTIMATED_TAM_EUR_PER_RDV,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-neutral-950 text-2xl font-semibold tracking-tight dark:text-neutral-50">
          {isAdmin ? "Rendez-vous (équipe)" : "Mes rendez-vous"}
        </h1>
      </div>

      <RendezVousMeetingsShell meetings={rows} showSellerColumn={isAdmin} />
    </div>
  );
}
