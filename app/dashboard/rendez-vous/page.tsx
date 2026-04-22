import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  const meetings = await prisma.meeting.findMany({
    where: { clerkOrgId: actor.activeTenantClerkOrgId },
    orderBy: { meetingAt: "desc" },
    take: 100,
    include: {
      seller: { select: { email: true } },
    },
  });

  const rows = meetings.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    meetingAt: m.meetingAt.toISOString(),
    outcome: m.outcome,
    durationMin: m.durationMin,
    sellerEmail: m.seller.email,
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
