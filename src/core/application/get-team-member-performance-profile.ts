import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { performanceParagraphText } from "@/lib/team-member-performance-helpers";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import {
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import type { SellerCommercialPerformanceSummary } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";

export type TeamMemberPerformanceProfile = {
  performanceForces: string | null;
  performanceAxes: string | null;
  performanceStop: string | null;
  fingerprint: string;
  meetingCount: number;
};

type Deps = {
  meetings: MeetingRepositoryPort;
  prompts: PromptTemplateRepositoryPort;
  analysis: AnalysisPort;
};

export async function getTeamMemberPerformanceProfile(
  deps: Deps,
  input: {
    organizationId: string;
    sellerUserId: string;
    sellerDisplayName: string;
    statsWindowDays?: number;
  },
): Promise<TeamMemberPerformanceProfile> {
  const statsWindowDays = parseStatsWindowDays(
    input.statsWindowDays != null ? String(input.statsWindowDays) : undefined,
  );
  const sincePreviousWindow = previousMeetingAtWindowStart(statsWindowDays);
  const meetingsForWindow = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: input.organizationId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: sincePreviousWindow,
    sellerUserId: input.sellerUserId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { currentWindow: meetings } = partitionMeetingsByStatsWindow(
    meetingsForWindow,
    statsWindowDays,
  );

  const meetingDigests = buildMeetingDigestsForAiSummary(meetings);
  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);
  let performanceSummary: SellerCommercialPerformanceSummary | null = null;

  if (aiEnabled && meetingDigests.length > 0) {
    const [performancePrompt, performanceModel] = await Promise.all([
      loadAnalysisPromptMarkdown(deps.prompts, "SELLER_PERFORMANCE"),
      resolvePromptGatewayModel(deps.prompts, "SELLER_PERFORMANCE"),
    ]);
    try {
      performanceSummary = await deps.analysis.summarizeSellerCommercialPerformance(
        {
          sellerDisplayName: input.sellerDisplayName,
          meetings: meetingDigests,
          systemMarkdown: performancePrompt,
          model: performanceModel,
        },
      );
    } catch {
      performanceSummary = null;
    }
  }

  const paragraphOptions = {
    hasSummary: performanceSummary != null,
    meetingCount: meetingDigests.length,
    aiEnabled,
  };

  return {
    performanceForces: performanceParagraphText(
      performanceSummary?.forces,
      paragraphOptions,
    ),
    performanceAxes: performanceParagraphText(
      performanceSummary?.axesAmelioration,
      paragraphOptions,
    ),
    performanceStop: performanceParagraphText(
      performanceSummary?.aStopper,
      paragraphOptions,
    ),
    fingerprint: teamMemberMeetingsFingerprint(meetings),
    meetingCount: meetings.length,
  };
}
