import { redirect } from "next/navigation";
import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { InfoCard } from "@/components/molecules/info-card";
import { PageHeader, PageHeaderSimple } from "@/components/molecules/page-header";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
import { getEnv } from "@/lib/env";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import {
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
        <PageHeaderSimple title="Performance" />
        <InfoCard
          title="Compte"
          description="Profil utilisateur non synchronisé — impossible de charger votre analyse personnelle."
        />
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
        <PageHeaderSimple title="Performance" />
        <InfoCard
          title="Organisation"
          description="Sélectionnez une organisation pour afficher les statistiques."
        />
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
        <PageHeader
          title={isOrgAdmin ? "Performance" : "Ma performance"}
          actions={<AnalysePagePeriodFallback value={home.statsWindowDays} />}
        />

        <AnalyseKpiCards home={home} isOrgAdmin={isOrgAdmin} />
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>

        <AnalyseStatistiquesGlobalesSection
          qualificationPotentialPoints={qualificationPotentialPoints}
          priorityOpportunities={priorityOpportunities}
          rdvCount={meetings.length}
          isTeamView={isOrgAdmin}
          statsWindowDays={home.statsWindowDays}
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
