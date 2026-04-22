import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { prisma } from "@/lib/prisma";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/lib/analysis-result-zod";

export const dynamic = "force-dynamic";

function latestByKind(
  analyses: Array<{ kind: string; result: unknown; createdAt: Date }>,
  kind: "SONCAS" | "DISC",
) {
  return analyses.find((a) => a.kind === kind);
}

export default async function AnalysePage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  const meetings = await prisma.meeting.findMany({
    where: { clerkOrgId: actor.activeTenantClerkOrgId },
    orderBy: { meetingAt: "desc" },
    take: 50,
    include: {
      analyses: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyse</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          SONCAS et DISC par rendez-vous — lancez l’analyse depuis la fiche
          rendez-vous.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rendez-vous et statut d’analyse</CardTitle>
          <CardDescription>
            Dernière analyse enregistrée par type (les relances créent une
            nouvelle version).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun rendez-vous. Créez-en un dans{" "}
              <Link href="/dashboard/rendez-vous" className="underline">
                Mes rendez-vous
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b text-left">
                    <th className="p-3 font-medium">Prospect</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">SONCAS</th>
                    <th className="p-3 font-medium">DISC</th>
                    <th className="p-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => {
                    const son = latestByKind(m.analyses, "SONCAS");
                    const di = latestByKind(m.analyses, "DISC");
                    const sonParsed = son
                      ? soncasResultSchema.safeParse(son.result)
                      : null;
                    const discParsed = di
                      ? discResultSchema.safeParse(di.result)
                      : null;
                    return (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{m.prospectName}</td>
                        <td className="text-muted-foreground p-3">
                          {new Date(m.meetingAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {sonParsed?.success ? (
                            <Badge variant="secondary">
                              {sonParsed.data.dominant}
                            </Badge>
                          ) : son ? (
                            <Badge variant="outline">Données</Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {discParsed?.success ? (
                            <Badge variant="secondary">
                              {discParsed.data.dominant}
                            </Badge>
                          ) : di ? (
                            <Badge variant="outline">Données</Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/dashboard/rendez-vous/${m.id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                            )}
                          >
                            Fiche
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
