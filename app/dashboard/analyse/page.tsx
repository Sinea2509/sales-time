import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ChevronRight,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MeetingMatrixScatter } from "@/components/organisms/meeting-matrix-scatter";
import { SalesProfileRadar } from "@/components/organisms/sales-profile-radar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { prospectInitials } from "@/lib/prospect-initials";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { parseStatsWindowDays } from "@/lib/dashboard-stats-window";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export const dynamic = "force-dynamic";

type AnalysePageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  const sp = searchParams != null ? await searchParams : {};
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const deps = makeApplicationDeps();
  const [home, meetings] = await Promise.all([
    getOrgDashboardHome(deps, {
      clerkOrgId: actor.activeTenantClerkOrgId,
      statsWindowDays,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: actor.activeTenantClerkOrgId,
      limit: 200,
    }),
  ]);

  if (!home) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analyse</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation pour afficher les statistiques.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalMeetings = meetings.length;

  const matrixPoints = meetings.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    salesScore: m.salesScore,
    potentialEur: ESTIMATED_TAM_EUR_PER_RDV,
    outcome: m.outcome,
  }));

  const top10 = [...meetings]
    .filter((m) => m.salesScore != null)
    .sort((a, b) => (b.salesScore ?? 0) - (a.salesScore ?? 0))
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Analyse</h1>
        <Suspense
          fallback={
            <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
          }
        >
          <DashboardStatsPeriodSelect value={home.statsWindowDays} />
        </Suspense>
      </div>

      <DashboardKpiCards home={home} />

      <section className="space-y-4">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Statistiques globales
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">
                Matrice des rendez-vous
              </CardTitle>
              <CardDescription>
                sur {totalMeetings} rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingMatrixScatter points={matrixPoints} />
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">
                Top 10 des rendez-vous
              </CardTitle>
              <CardDescription>Classés par SalesScore</CardDescription>
            </CardHeader>
            <CardContent>
              {top10.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun rendez-vous analysé pour l’instant.
                </p>
              ) : (
                <ol className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {top10.map((m, index) => (
                    <li key={m.id}>
                      <Link
                        href={`/dashboard/rendez-vous/${m.id}`}
                        className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                      >
                        <span className="text-muted-foreground w-5 text-right text-sm font-medium tabular-nums">
                          {index + 1}
                        </span>
                        <div className="bg-neutral-100 text-neutral-700 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-200">
                          {prospectInitials(m.prospectName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-neutral-950 truncate text-sm font-semibold dark:text-neutral-50">
                            {m.prospectName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {dateShort.format(new Date(m.meetingAt))}
                          </p>
                        </div>
                        <span className="text-base font-semibold tabular-nums text-neutral-950 dark:text-neutral-100">
                          {m.salesScore}
                        </span>
                        <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Mes recommandations
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                  <Sparkles className="size-4 text-violet-600 dark:text-violet-300" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Mon profil de vente</CardTitle>
                  <CardDescription>
                    Synthèse DISC / SONCAS récurrente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SalesProfileRadar
                scores={{
                  assertivite: 68,
                  ecouteActive: 86,
                  capitalSympathie: 90,
                  argumentation: 72,
                  objections: 58,
                  nextSteps: 81,
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                    <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">Mes progrès</CardTitle>
                    <CardDescription>
                      Évolution sur les derniers rendez-vous
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>
                      Découverte client plus approfondie : +18% de besoins
                      qualifiés en entretien.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>
                      Reformulation des objections désormais systématique avant
                      de répondre.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>
                      Closing plus net : proposition d’une prochaine étape dans
                      92% des RDV récents.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                    <Target className="size-4 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      Mes axes d’amélioration
                    </CardTitle>
                    <CardDescription>
                      Pistes concrètes à travailler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <span>
                      Mieux ancrer le levier « Argent » : chiffrer le ROI dès la
                      découverte.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <span>
                      Réduire le temps de présentation de 25% au profit du
                      questionnement.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <span>
                      Anticiper les signaux « Sécurité » sur les prospects
                      profil C.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
