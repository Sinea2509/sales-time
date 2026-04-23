import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import {
  AnalyseTopMeetingsTable,
  type AnalyseTopMeetingRow,
} from "@/components/organisms/analyse-top-meetings-table";
import { MeetingMatrixScatter } from "@/components/organisms/meeting-matrix-scatter";
import { OrgSoncasRadar } from "@/components/organisms/org-soncas-radar";
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
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import {
  meetingAtSinceForStatsWindow,
  parseStatsWindowDays,
} from "@/lib/dashboard-stats-window";
import { averageSoncasDriverScores } from "@/lib/org-soncas-team-aggregate";
import { makeApplicationDeps } from "@/src/adapters/composition";
import {
  buildOrgAdminImprovementBullets,
  buildOrgAdminProgressBullets,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export const dynamic = "force-dynamic";

type AnalysePageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeTenantClerkOrgId) {
    redirect("/dashboard");
  }

  if (actor.dashboardRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analyse</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compte</CardTitle>
            <CardDescription>
              Profil utilisateur non synchronisé — impossible de charger votre
              analyse personnelle.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const sp = searchParams != null ? await searchParams : {};
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const deps = makeApplicationDeps();
  const isOrgAdmin = actor.dashboardRoleMode === "admin";
  const sinceWindow = meetingAtSinceForStatsWindow(statsWindowDays);
  const sellerScope =
    actor.dashboardRoleMode === "member"
      ? (actor.internalUserId ?? undefined)
      : undefined;

  const [home, meetings] = await Promise.all([
    getOrgDashboardHome(deps, {
      clerkOrgId: actor.activeTenantClerkOrgId,
      statsWindowDays,
      sellerUserId: sellerScope,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: actor.activeTenantClerkOrgId,
      limit: isOrgAdmin ? ORG_ADMIN_DASHBOARD_MEETING_CAP : 200,
      meetingAtSince: sinceWindow,
      includeLatestSoncasResult: isOrgAdmin,
      sellerUserId: sellerScope,
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

  const matrixSource = isOrgAdmin ? meetings.slice(0, 200) : meetings;
  const matrixPoints = matrixSource.map((m) => ({
    id: m.id,
    prospectName: m.prospectName,
    salesScore: m.salesScore,
    potentialEur: ESTIMATED_TAM_EUR_PER_RDV,
    outcome: m.outcome,
  }));

  const soncasForRadar = meetings
    .map((m) => m.latestSoncasResult)
    .filter((r): r is NonNullable<typeof r> => r != null);
  const orgSoncasAverages = averageSoncasDriverScores(soncasForRadar);
  const adminProgressBullets = isOrgAdmin
    ? buildOrgAdminProgressBullets(home)
    : null;
  const adminImprovementBullets = isOrgAdmin
    ? buildOrgAdminImprovementBullets(orgSoncasAverages)
    : null;

  const top10: AnalyseTopMeetingRow[] = [...meetings]
    .filter((m) => m.salesScore != null)
    .sort((a, b) => (b.salesScore ?? 0) - (a.salesScore ?? 0))
    .slice(0, 10)
    .map((m) => ({
      id: m.id,
      prospectName: m.prospectName,
      meetingAt: m.meetingAt.toISOString(),
      salesScore: m.salesScore ?? 0,
      outcome: m.outcome,
      potentialEur: ESTIMATED_TAM_EUR_PER_RDV,
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isOrgAdmin ? "Analyse (équipe)" : "Mon analyse"}
        </h1>
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
          {isOrgAdmin ? "Statistiques globales (équipe)" : "Statistiques globales"}
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">
                Matrice des rendez-vous
              </CardTitle>
              <CardDescription>
                {isOrgAdmin
                  ? `Échantillon sur la période (${matrixPoints.length} RDV affichés)`
                  : `Sur vos ${totalMeetings} rendez-vous (période sélectionnée)`}
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
              <AnalyseTopMeetingsTable rows={top10} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          {isOrgAdmin ? "Recommandations équipe" : "Mes recommandations"}
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                  <Sparkles className="size-4 text-violet-600 dark:text-violet-300" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {isOrgAdmin ? "Profil SONCAS équipe" : "Mon profil de vente"}
                  </CardTitle>
                  <CardDescription>
                    {isOrgAdmin
                      ? "Moyenne des leviers sur les analyses de la période"
                      : "Synthèse DISC / SONCAS récurrente"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isOrgAdmin ? (
                <OrgSoncasRadar averages={orgSoncasAverages} seriesLabel="Équipe" />
              ) : (
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
              )}
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
                    <CardTitle className="text-base">
                      {isOrgAdmin ? "Tendances positives" : "Mes progrès"}
                    </CardTitle>
                    <CardDescription>
                      {isOrgAdmin
                        ? "Basé sur les KPI agrégés de l’organisation"
                        : "Évolution sur les derniers rendez-vous"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(isOrgAdmin && adminProgressBullets
                    ? adminProgressBullets
                    : [
                        "Découverte client plus approfondie : +18% de besoins qualifiés en entretien.",
                        "Reformulation des objections désormais systématique avant de répondre.",
                        "Closing plus net : proposition d’une prochaine étape dans 92% des RDV récents.",
                      ]
                  ).map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
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
                      {isOrgAdmin ? "Axes d’amélioration" : "Mes axes d’amélioration"}
                    </CardTitle>
                    <CardDescription>
                      {isOrgAdmin
                        ? "À partir des moyennes SONCAS de l’équipe"
                        : "Pistes concrètes à travailler"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(isOrgAdmin && adminImprovementBullets
                    ? adminImprovementBullets
                    : [
                        "Mieux ancrer le levier « Argent » : chiffrer le ROI dès la découverte.",
                        "Réduire le temps de présentation de 25% au profit du questionnement.",
                        "Anticiper les signaux « Sécurité » sur les prospects profil C.",
                      ]
                  ).map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
