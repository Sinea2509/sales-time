import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Sparkle, Sparkles, Target } from "lucide-react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import {
  AnalyseTopMeetingsTable,
  type AnalyseTopMeetingRow,
} from "@/components/organisms/analyse-top-meetings-table";
import { SalesProfileRadar } from "@/components/organisms/sales-profile-radar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import {
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import {
  meetingAtSinceForStatsWindow,
  parseStatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export const dynamic = "force-dynamic";

type AnalysePageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        <h1 className={pageTitleClass}>Analyse</h1>
        <Card>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Compte</CardTitle>
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

  const deps = getApplicationDeps();
  const isOrgAdmin = actor.workspaceRoleMode === "admin";
  const sinceWindow = meetingAtSinceForStatsWindow(statsWindowDays);
  const sellerScope =
    actor.workspaceRoleMode === "member"
      ? (actor.internalUserId ?? undefined)
      : undefined;

  const [home, meetings] = await Promise.all([
    getOrgDashboardHome(deps, {
      organizationId: actor.activeOrganizationId,
      statsWindowDays,
      sellerUserId: sellerScope,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      limit: isOrgAdmin ? ORG_ADMIN_DASHBOARD_MEETING_CAP : 200,
      meetingAtSince: sinceWindow,
      includeLatestSoncasResult: false,
      sellerUserId: sellerScope,
    }),
  ]);

  if (!home) {
    return (
      <div className="space-y-6">
        <h1 className={pageTitleClass}>Analyse</h1>
        <Card>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation pour afficher les statistiques.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
      tamMinutesPerRdv: home.tamMinutesPerRdv,
    }));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={pageTitleClass}>
            {isOrgAdmin ? "Analyse" : "Mon analyse"}
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
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>

        <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardHeader>
            <CardTitle className={cardTitleClass}>
              Top 10 des rendez-vous
            </CardTitle>
            <CardDescription>Classés par SalesScore</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyseTopMeetingsTable rows={top10} />
          </CardContent>
        </Card>
      </section>

      {!isOrgAdmin ? (
        <section className="space-y-4">
          <h2 className={sectionHeadingClass}>Mes recommandations</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                    <Sparkles className="size-4 text-violet-600 dark:text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className={cardTitleClass}>
                      Mon profil de vente
                    </CardTitle>
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
                      <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className={cardTitleClass}>
                        Mes progrès
                      </CardTitle>
                      <CardDescription>
                        Évolution sur les derniers rendez-vous
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Découverte client plus approfondie : +18% de besoins qualifiés en entretien.",
                      "Reformulation des objections désormais systématique avant de répondre.",
                      "Closing plus net : proposition d’une prochaine étape dans 92% des RDV récents.",
                    ].map((line) => (
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
                      <CardTitle className={cardTitleClass}>
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
                    {[
                      "Mieux ancrer le levier « Argent » : chiffrer le ROI dès la découverte.",
                      "Réduire le temps de présentation de 25% au profit du questionnement.",
                      "Anticiper les signaux « Sécurité » sur les prospects profil C.",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Sparkle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
