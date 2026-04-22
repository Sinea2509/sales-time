import Link from "next/link";
import { redirect } from "next/navigation";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  const meetings = await prisma.meeting.findMany({
    where: { clerkOrgId: actor.activeTenantClerkOrgId },
    orderBy: { meetingAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mes rendez-vous
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enregistrez un rendez-vous avec transcript pour mesurer la performance
          et lancer l’analyse SONCAS / DISC.
        </p>
      </div>

      <Card id="preparer-rdv">
        <CardHeader>
          <CardTitle className="text-base">Nouveau rendez-vous</CardTitle>
          <CardDescription>
            Transcript manuel — idéal pour alimenter l’IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
          <CardDescription>
            {meetings.length} rendez-vous récent(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun rendez-vous pour cette organisation.
            </p>
          ) : (
            <ul className="divide-border divide-y rounded-lg border">
              {meetings.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
                >
                  <div>
                    <p className="font-medium">{m.prospectName}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(m.meetingAt).toLocaleString()} · {m.outcome}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/rendez-vous/${m.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Ouvrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
