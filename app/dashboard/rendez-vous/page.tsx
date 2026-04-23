import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  const deps = makeApplicationDeps();
  const meetings = await deps.meetings.listRecentMeetingsForDashboard({
    clerkOrgId: actor.activeTenantClerkOrgId,
    limit: 200,
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
          Mes rendez-vous
        </h1>
      </div>

      <RendezVousMeetingsShell meetings={rows} />
    </div>
  );
}
