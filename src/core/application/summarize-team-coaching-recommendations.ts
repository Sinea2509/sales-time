import {
  buildOrgAdminProgressBullets,
  buildKissTeamRollupFromMeetings,
} from "@/src/core/application/get-org-admin-dashboard";
import type { DashboardHomeFigures } from "@/src/core/domain/dashboard-home-from-meetings";
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
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { sellerCoachingScopeKey } from "@/src/core/application/ai-summary-cache-scopes";
import { readThroughAiSummaryCache } from "@/src/core/application/read-through-ai-summary-cache";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export type TeamCoachingRecommendationBullets = {
  progressBullets: string[];
  improvementBullets: string[];
  /** true when bullets come from the AI gateway. */
  fromAi: boolean;
};

function fallbackBullets(input: {
  meetings: RecentMeetingListRow[];
  home: DashboardHomeFigures;
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
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    aiSummaryCache?: AiSummaryCacheRepositoryPort;
  },
  input: {
    meetings: RecentMeetingListRow[];
    previousMeetings: RecentMeetingListRow[];
    teamSalesProfile: TeamSalesProfileAggregate;
    previousSalesProfile: TeamSalesProfileAggregate;
    statsWindowDays: StatsWindowDays;
    audience: "manager" | "commercial";
    organizationKissPromptAppendix?: string | null;
    home: DashboardHomeFigures;
    cacheContext?: {
      organizationId: string;
      sellerUserId: string | null;
    };
  },
): Promise<TeamCoachingRecommendationBullets> {
  const digests = buildMeetingDigestsForAiSummary(input.meetings);
  if (digests.length === 0 || !getEnv().AI_GATEWAY_API_KEY) {
    return fallbackBullets({
      meetings: input.meetings,
      home: input.home,
    });
  }

  const computeBullets = async (): Promise<TeamCoachingRecommendationBullets | null> => {
    try {
      const basePrompt = await loadAnalysisPromptMarkdown(deps.prompts, "TEAM_COACHING");
      const systemMarkdown = appendOrganizationKissPromptAppendix(
        basePrompt,
        input.organizationKissPromptAppendix,
      );
      const model = await resolvePromptGatewayModel(deps.prompts, "TEAM_COACHING");
      const result = await deps.analysis.summarizeTeamCoachingRecommendations({
        systemMarkdown,
        model,
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
      return null;
    }
  };

  if (deps.aiSummaryCache && input.cacheContext) {
    const meetingsFingerprint = teamMemberMeetingsFingerprint(input.meetings);
    const scopeKey = sellerCoachingScopeKey({
      sellerUserId: input.cacheContext.sellerUserId,
      statsWindowDays: input.statsWindowDays,
      audience: input.audience,
    });
    const cached = await readThroughAiSummaryCache<TeamCoachingRecommendationBullets>(
      { aiSummaryCache: deps.aiSummaryCache },
      {
        organizationId: input.cacheContext.organizationId,
        scopeKey,
        meetingsFingerprint,
        compute: computeBullets,
      },
    );
    if (cached) {
      return cached;
    }
  } else {
    const fresh = await computeBullets();
    if (fresh) {
      return fresh;
    }
  }

  return fallbackBullets({
    meetings: input.meetings,
    home: input.home,
  });
}
