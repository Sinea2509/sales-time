import { notFound, redirect } from "next/navigation";
import { TeamMemberPerformanceShell } from "@/components/organisms/team-member-performance-shell";
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
  performanceParagraphText,
  postureLabelFromMeetings,
} from "@/lib/team-member-performance-helpers";
import { getApplicationDeps } from "@/lib/application-deps";
import {
  buildKissTeamRollupFromMeetings,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  DISC_BAR_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
} from "@/src/core/domain/seller-affinity-from-meetings";
import {
  meetingAtSinceForStatsWindow,
  parseStatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type {
  SellerCommercialPerformanceSummary,
  SellerRelationalAffinitySummary,
} from "@/src/core/ports/analysis-port";

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

  const since = meetingAtSinceForStatsWindow(statsWindowDays);
  const meetings = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: orgId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: since,
    sellerUserId: userId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { decouverte, proposition } = countMeetingTypes(meetings);
  const posture = postureLabelFromMeetings(meetings);
  const nameLine =
    [member.user.firstName?.trim() ?? "", member.user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || member.user.email;

  const meetingDigests = buildMeetingDigestsForAiSummary(meetings);
  let performanceSummary: SellerCommercialPerformanceSummary | null = null;
  let relationalAffinity: SellerRelationalAffinitySummary | null = null;
  if (aiEnabled && meetingDigests.length > 0) {
    const [performancePrompt, affinityPrompt, performanceModel, affinityModel] =
      await Promise.all([
      loadAnalysisPromptMarkdown(deps.prompts, "SELLER_PERFORMANCE"),
      loadAnalysisPromptMarkdown(deps.prompts, "SELLER_AFFINITY"),
      resolvePromptGatewayModel(deps.prompts, "SELLER_PERFORMANCE"),
      resolvePromptGatewayModel(deps.prompts, "SELLER_AFFINITY"),
    ]);
    const aiPayload = {
      sellerDisplayName: nameLine,
      meetings: meetingDigests,
    };
    const [perfRes, affinityRes] = await Promise.allSettled([
      deps.analysis.summarizeSellerCommercialPerformance({
        ...aiPayload,
        systemMarkdown: performancePrompt,
        model: performanceModel,
      }),
      deps.analysis.summarizeSellerRelationalAffinity({
        ...aiPayload,
        systemMarkdown: affinityPrompt,
        model: affinityModel,
      }),
    ]);
    if (perfRes.status === "fulfilled") performanceSummary = perfRes.value;
    if (affinityRes.status === "fulfilled")
      relationalAffinity = affinityRes.value;
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

  const paragraphOptions = {
    hasSummary: performanceSummary != null,
    meetingCount: meetingDigests.length,
    aiEnabled,
  };

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
      nameLine={nameLine}
      initials={prospectInitials(nameLine)}
      posture={posture}
      nbRdvs={home.nbRdvs}
      decouverte={decouverte}
      proposition={proposition}
      tamCumuleMinutes={home.tamCumuleMinutes}
      performanceForces={performanceParagraphText(
        performanceSummary?.forces,
        paragraphOptions,
      )}
      performanceAxes={performanceParagraphText(
        performanceSummary?.axesAmelioration,
        paragraphOptions,
      )}
      performanceStop={performanceParagraphText(
        performanceSummary?.aStopper,
        paragraphOptions,
      )}
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
    />
  );
}
