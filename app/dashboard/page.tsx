import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { parseStatsWindowDays } from "@/lib/dashboard-stats-window";
import { meetingOutcomeLabel } from "@/lib/meeting-outcome-labels";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function DashboardHomePage({
  searchParams,
}: DashboardPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }

  const sp = searchParams != null ? await searchParams : {};
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const home =
    actor.activeTenantClerkOrgId != null
      ? await getOrgDashboardHome(makeApplicationDeps(), {
          clerkOrgId: actor.activeTenantClerkOrgId,
          statsWindowDays,
        })
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Vue synthétique de l’organisation active. Les KPI « Mes statistiques »
          utilisent la date du rendez-vous sur une fenêtre glissante. Le TAM est
          une estimation ({eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} par
          RDV) en attendant une intégration CRM.
        </p>
      </div>

      {!actor.activeTenantClerkOrgId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation Clerk pour afficher les indicateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !home ? null : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Mes statistiques
            </h2>
            <Suspense
              fallback={
                <Skeleton className="h-9 w-36 shrink-0 self-start sm:self-auto" />
              }
            >
              <DashboardStatsPeriodSelect value={home.statsWindowDays} />
            </Suspense>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TAM cumulé</CardTitle>
                <CardDescription>
                  Estimation sur les RDV des {home.statsWindowDays} derniers
                  jours (date du RDV)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {eurFormatter.format(home.tamCumuleEur)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nb de rdvs</CardTitle>
                <CardDescription>
                  Volume sur {home.statsWindowDays} jours (date du RDV)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {home.nbRdvs}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TUC optimisé</CardTitle>
                <CardDescription>
                  Part des RDV de la période (échantillon : jusqu’à 8 derniers
                  enregistrements) avec SONCAS et DISC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {home.tucOptimisePercent === null
                    ? "—"
                    : `${home.tucOptimisePercent}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Mes rendez-vous
                </h2>
                <p className="text-muted-foreground text-sm">
                  Jusqu’à 8 derniers enregistrements dont la date de RDV est dans
                  les {home.statsWindowDays} derniers jours (même fenêtre que les
                  KPI).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/rendez-vous#preparer-rdv"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                >
                  Préparer un rdv
                </Link>
                <Link
                  href="/dashboard/analyse"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Analyser un nouveau rdv
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Date RDV</th>
                    <th className="px-3 py-2.5 font-medium">Prospect</th>
                    <th className="px-3 py-2.5 font-medium">Résultat</th>
                    <th className="px-3 py-2.5 font-medium">Commercial</th>
                    <th className="px-3 py-2.5 font-medium">SONCAS</th>
                    <th className="px-3 py-2.5 font-medium">DISC</th>
                    <th className="px-3 py-2.5 font-medium">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {home.recentMeetings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-muted-foreground px-3 py-6 text-center"
                      >
                        Aucun rendez-vous dans cette fenêtre. Essayez une période
                        plus longue ou enregistrez un RDV avec une date dans
                        l’intervalle.
                      </td>
                    </tr>
                  ) : (
                    home.recentMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="text-muted-foreground px-3 py-2.5 tabular-nums">
                          {dateTimeFormatter.format(new Date(m.meetingAt))}
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {m.prospectName}
                        </td>
                        <td className="px-3 py-2.5">
                          {meetingOutcomeLabel(m.outcome)}
                        </td>
                        <td className="text-muted-foreground px-3 py-2.5">
                          {m.sellerEmail ?? "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.hasSoncas ? "Oui" : "Non"}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.hasDisc ? "Oui" : "Non"}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/dashboard/rendez-vous/${m.id}`}
                            className={cn(
                              buttonVariants({
                                variant: "link",
                                size: "sm",
                              }),
                              "h-auto p-0",
                            )}
                          >
                            Ouvrir
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
