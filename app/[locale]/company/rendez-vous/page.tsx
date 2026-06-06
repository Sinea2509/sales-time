import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { formatUserDisplayName } from "@/lib/user-display-name";

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
    outcome: m.outcome,
    durationMin: m.durationMin,
    sellerName: formatUserDisplayName({
      firstName: m.sellerFirstName,
      lastName: m.sellerLastName,
      email: m.sellerEmail,
    }),
    salesScore: m.salesScore,
    potentialAmount: m.potentialAmount,
  }));

  return (
    <div className="space-y-8">
      <PageHeaderSimple title={isAdmin ? "Rendez-vous" : "Mes rendez-vous"} />

      <RendezVousMeetingsShell meetings={rows} showSellerColumn={isAdmin} />
    </div>
  );
}
