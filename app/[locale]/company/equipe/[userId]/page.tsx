import { notFound, redirect } from "next/navigation";
import { TeamMemberPerformanceShell } from "@/components/organisms/team-member-performance-shell";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import {
  appendOrganizationKissPromptAppendix,
  loadAnalysisPromptMarkdown,
} from "@/lib/load-analysis-prompt";
import { prospectInitials } from "@/lib/prospect-initials";
import {
  countMeetingTypes,
  postureLabelFromMeetings,
} from "@/lib/team-member-performance-helpers";
import { getApplicationDeps } from "@/lib/application-deps";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import {
  buildKissTeamRollupFromMeetings,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  DISC_BAR_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
} from "@/src/core/domain/seller-affinity-from-meetings";
import {
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { buildQualificationPotentialMatrixPoints } from "@/src/core/domain/meeting-analyse-matrices";
import { aggregateTeamSalesProfileFromMeetings } from "@/src/core/domain/sales-profile-from-meetings";
import type { SellerRelationalAffinitySummary } from "@/src/core/ports/analysis-port";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ jours?: string }>;
};

export default async function ManagerCommercialViewPage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const sp = searchParams != null ? await searchParams : {};
  const joursParam = Array.isArray(sp.jours) ? sp.jours[0] : sp.jours;
  if (joursParam === "30") {
    redirect(`/company/equipe/${userId}`);
  }
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = actor.activeOrganizationId;
  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);

  const [member, home, globalKissJson] = await Promise.all([
    deps.organizationTeam.findMembershipForManagerView(orgId, userId),
    getOrgDashboardHome(
      {
        meetings: deps.meetings,
        organizationSettings: deps.organizationSettings,
      },
      {
        organizationId: orgId,
        statsWindowDays,
        sellerUserId: userId,
      },
    ),
    deps.globalKissCoachingPrompts.getPrompts(),
  ]);

  if (!member) notFound();
  if (!home) redirect("/company");

  const sincePreviousWindow = previousMeetingAtWindowStart(statsWindowDays);
  const meetingsForWindow = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: orgId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: sincePreviousWindow,
    sellerUserId: userId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { currentWindow: meetings, previousWindow: previousMeetings } =
    partitionMeetingsByStatsWindow(meetingsForWindow, statsWindowDays);

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
    audience: "manager",
    organizationKissPromptAppendix: aiEnabled
      ? kissMarkdownAppendixForAudience(globalKissJson, "manager")
      : null,
    home,
  });
  const { progressBullets, improvementBullets } = coachingBullets;

  const { decouverte, proposition } = countMeetingTypes(meetings);
  const posture = postureLabelFromMeetings(meetings);
  const nameLine =
    [member.user.firstName?.trim() ?? "", member.user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || member.user.email;

  const meetingDigests = buildMeetingDigestsForAiSummary(meetings);
  const performanceProfile = await getTeamMemberPerformanceProfile(deps, {
    organizationId: orgId,
    sellerUserId: userId,
    sellerDisplayName: nameLine,
    statsWindowDays,
  });
  let relationalAffinity: SellerRelationalAffinitySummary | null = null;
  if (aiEnabled && meetingDigests.length > 0) {
    const [affinityPrompt, affinityModel] = await Promise.all([
      loadAnalysisPromptMarkdown(deps.prompts, "SELLER_AFFINITY"),
      resolvePromptGatewayModel(deps.prompts, "SELLER_AFFINITY"),
    ]);
    try {
      relationalAffinity = await deps.analysis.summarizeSellerRelationalAffinity({
        sellerDisplayName: nameLine,
        meetings: meetingDigests,
        systemMarkdown: affinityPrompt,
        model: affinityModel,
      });
    } catch {
      relationalAffinity = null;
    }
  }

  const kissSellerRollup = buildKissTeamRollupFromMeetings(meetings);
  let kissSellerStrengthsNarrative: string | null = null;
  if (aiEnabled) {
    try {
      const basePrompt = await loadAnalysisPromptMarkdown(
        deps.prompts,
        "ORG_KISS_ROLLUP",
      );
      const systemMarkdown = appendOrganizationKissPromptAppendix(
        basePrompt,
        kissMarkdownAppendixForAudience(globalKissJson, "manager"),
      );
      const orgKissModel = await resolvePromptGatewayModel(
        deps.prompts,
        "ORG_KISS_ROLLUP",
      );
      kissSellerStrengthsNarrative = await deps.analysis.summarizeOrgKissRollup({
        systemMarkdown,
        rollup: kissSellerRollup,
        model: orgKissModel,
      });
    } catch {
      kissSellerStrengthsNarrative = null;
    }
  }

  const discAffinityBars = aggregateDiscAffinityBarsFromMeetings(meetings);
  const soncasAffinityBars = aggregateSoncasAffinityBarsFromMeetings(meetings);
  const discBarSource =
    discAffinityBars.length > 0
      ? discAffinityBars
      : emptyDiscAffinityPlaceholder();
  const soncasBarSource =
    soncasAffinityBars.length > 0
      ? soncasAffinityBars
      : emptySoncasAffinityPlaceholder();

  return (
    <TeamMemberPerformanceShell
      sellerUserId={userId}
      statsWindowDays={statsWindowDays}
      performanceFingerprint={performanceProfile.fingerprint}
      nameLine={nameLine}
      initials={prospectInitials(nameLine)}
      posture={posture}
      nbRdvs={home.nbRdvs}
      decouverte={decouverte}
      proposition={proposition}
      tamMinutesAvg={home.avgDurationMin}
      performanceForces={performanceProfile.performanceForces}
      performanceAxes={performanceProfile.performanceAxes}
      performanceStop={performanceProfile.performanceStop}
      discBarItems={discBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: DISC_BAR_CLASS[d.key],
      }))}
      soncasBarItems={soncasBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: SONCAS_BAR_CLASS[d.key],
      }))}
      discAffinityText={relationalAffinity?.discAffinity ?? null}
      soncasAffinityText={relationalAffinity?.soncasAffinity ?? null}
      kissSellerStrengthsNarrative={kissSellerStrengthsNarrative}
      kissSellerRollup={kissSellerRollup}
      qualificationPotentialPoints={qualificationPotentialPoints}
      priorityOpportunities={priorityOpportunities}
      salesProfile={teamSalesProfile.scores}
      previousSalesProfile={previousSalesProfile.scores}
      salesProfileRdvCount={teamSalesProfile.rdvCount}
      progressBullets={progressBullets}
      improvementBullets={improvementBullets}
      home={home}
    />
  );
}
