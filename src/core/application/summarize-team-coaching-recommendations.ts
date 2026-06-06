import {
  buildOrgAdminProgressBullets,
  buildKissTeamRollupFromMeetings,
} from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { kissCoachingBulletsFromMeetings } from "@/src/core/domain/kiss-coaching-bullets-from-meetings";
import type { TeamSalesProfileAggregate } from "@/src/core/domain/sales-profile-from-meetings";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { getEnv } from "@/lib/env";
import {
  appendOrganizationKissPromptAppendix,
  loadAnalysisPromptMarkdown,
} from "@/lib/load-analysis-prompt";

export type TeamCoachingRecommendationBullets = {
  progressBullets: string[];
  improvementBullets: string[];
  /** true when bullets come from the AI gateway. */
  fromAi: boolean;
};

function fallbackBullets(input: {
  meetings: RecentMeetingListRow[];
  home: OrgDashboardHome;
}): TeamCoachingRecommendationBullets {
  const kissImprove = kissCoachingBulletsFromMeetings(input.meetings, "improve");
  const kissStart = kissCoachingBulletsFromMeetings(input.meetings, "start");
  return {
    progressBullets:
      kissImprove.length > 0
        ? kissImprove
        : buildOrgAdminProgressBullets(input.home),
    improvementBullets:
      kissStart.length > 0
        ? kissStart
        : [
            "Lancez des analyses KISS sur vos rendez-vous pour obtenir des pistes concrètes à démarrer.",
          ],
    fromAi: false,
  };
}

export async function summarizeTeamCoachingRecommendations(
  deps: { analysis: AnalysisPort; prompts: PromptTemplateRepositoryPort },
  input: {
    meetings: RecentMeetingListRow[];
    previousMeetings: RecentMeetingListRow[];
    teamSalesProfile: TeamSalesProfileAggregate;
    previousSalesProfile: TeamSalesProfileAggregate;
    statsWindowDays: StatsWindowDays;
    model: string;
    audience: "manager" | "commercial";
    organizationKissPromptAppendix?: string | null;
    home: OrgDashboardHome;
  },
): Promise<TeamCoachingRecommendationBullets> {
  const digests = buildMeetingDigestsForAiSummary(input.meetings);
  if (digests.length === 0 || !getEnv().AI_GATEWAY_API_KEY) {
    return fallbackBullets({
      meetings: input.meetings,
      home: input.home,
    });
  }

  try {
    const basePrompt = await loadAnalysisPromptMarkdown(deps.prompts, "TEAM_COACHING");
    const systemMarkdown = appendOrganizationKissPromptAppendix(
      basePrompt,
      input.organizationKissPromptAppendix,
    );
    const result = await deps.analysis.summarizeTeamCoachingRecommendations({
      systemMarkdown,
      model: input.model,
      statsWindowDays: input.statsWindowDays,
      audience: input.audience,
      meetings: digests,
      salesProfile: input.teamSalesProfile.scores,
      previousSalesProfile: input.previousSalesProfile.scores,
      kissRollup: buildKissTeamRollupFromMeetings(input.meetings),
    });
    return {
      progressBullets: result.progressBullets,
      improvementBullets: result.improvementBullets,
      fromAi: true,
    };
  } catch {
    return fallbackBullets({
      meetings: input.meetings,
      home: input.home,
    });
  }
}
