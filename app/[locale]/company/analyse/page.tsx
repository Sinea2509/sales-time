import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { getEnv } from "@/lib/env";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import {
  Card,
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
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import {
  buildQualificationPotentialMatrixPoints,
} from "@/src/core/domain/meeting-analyse-matrices";
import { aggregateTeamSalesProfileFromMeetings } from "@/src/core/domain/sales-profile-from-meetings";

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
        <h1 className={pageTitleClass}>Performance</h1>
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
  const sincePreviousWindow = previousMeetingAtWindowStart(statsWindowDays);
  const sellerScope =
    actor.workspaceRoleMode === "member"
      ? (actor.internalUserId ?? undefined)
      : undefined;

  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);
  const [home, meetingsForWindow, globalKissJson] = await Promise.all([
    getOrgDashboardHome(deps, {
      organizationId: actor.activeOrganizationId,
      statsWindowDays,
      sellerUserId: sellerScope,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      limit: isOrgAdmin ? ORG_ADMIN_DASHBOARD_MEETING_CAP : 200,
      meetingAtSince: sincePreviousWindow,
      includeLatestSoncasResult: true,
      includeLatestDiscResult: true,
      includeLatestKissResult: true,
      sellerUserId: sellerScope,
    }),
    aiEnabled ? deps.globalKissCoachingPrompts.getPrompts() : Promise.resolve(null),
  ]);

  const { currentWindow: meetings, previousWindow: previousMeetings } =
    partitionMeetingsByStatsWindow(meetingsForWindow, statsWindowDays);

  if (!home) {
    return (
      <div className="space-y-6">
        <h1 className={pageTitleClass}>Performance</h1>
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

  const priorityOpportunities: AnalysePriorityOpportunityRow[] = [...meetings]
    .filter((m) => m.potentialAmount != null && m.potentialAmount > 0)
    .sort((a, b) => (b.potentialAmount ?? 0) - (a.potentialAmount ?? 0))
    .slice(0, 10)
    .map((m) => ({
      id: m.id,
      prospectName: m.prospectName,
      potentialAmount: m.potentialAmount!,
      salesScore: m.salesScore,
      outcome: m.outcome,
    }));

  const qualificationPotentialPoints =
    buildQualificationPotentialMatrixPoints(meetings);
  const teamSalesProfile = aggregateTeamSalesProfileFromMeetings(meetings);
  const previousSalesProfile =
    aggregateTeamSalesProfileFromMeetings(previousMeetings);
  const coachingBullets = await summarizeTeamCoachingRecommendations(deps, {
    meetings,
    previousMeetings,
    teamSalesProfile,
    previousSalesProfile,
    statsWindowDays,
    model: ANALYSIS_GATEWAY_MODEL,
    audience: isOrgAdmin ? "manager" : "commercial",
    organizationKissPromptAppendix: aiEnabled
      ? kissMarkdownAppendixForAudience(
          globalKissJson,
          isOrgAdmin ? "manager" : "commercial",
        )
      : null,
    home,
  });
  const { progressBullets, improvementBullets } = coachingBullets;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={pageTitleClass}>
            {isOrgAdmin ? "Performance" : "Ma performance"}
          </h1>
          <Suspense
            fallback={
              <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
            }
          >
            <DashboardStatsPeriodSelect value={home.statsWindowDays} />
          </Suspense>
        </div>

        <AnalyseKpiCards home={home} isOrgAdmin={isOrgAdmin} />
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>

        <AnalyseStatistiquesGlobalesSection
          qualificationPotentialPoints={qualificationPotentialPoints}
          priorityOpportunities={priorityOpportunities}
          rdvCount={meetings.length}
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Recommandations</h2>
        <AnalyseRecommandationsSection
          salesProfile={teamSalesProfile.scores}
          previousSalesProfile={previousSalesProfile.scores}
          rdvCount={teamSalesProfile.rdvCount}
          progressBullets={progressBullets}
          improvementBullets={improvementBullets}
          isOrgAdmin={isOrgAdmin}
        />
      </section>
    </div>
  );
}
