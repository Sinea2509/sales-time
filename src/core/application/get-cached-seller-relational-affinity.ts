import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { sellerAffinityScopeKey } from "@/src/core/application/ai-summary-cache-scopes";
import { readThroughAiSummaryCache } from "@/src/core/application/read-through-ai-summary-cache";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type {
  AnalysisPort,
  SellerRelationalAffinitySummary,
} from "@/src/core/ports/analysis-port";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

type Deps = {
  analysis: AnalysisPort;
  prompts: PromptTemplateRepositoryPort;
  aiSummaryCache: AiSummaryCacheRepositoryPort;
};

export async function getCachedSellerRelationalAffinity(
  deps: Deps,
  input: {
    organizationId: string;
    sellerUserId: string;
    sellerDisplayName: string;
    statsWindowDays: StatsWindowDays;
    meetings: RecentMeetingListRow[];
  },
): Promise<SellerRelationalAffinitySummary | null> {
  const meetingDigests = buildMeetingDigestsForAiSummary(input.meetings);
  if (!getEnv().AI_GATEWAY_API_KEY || meetingDigests.length === 0) {
    return null;
  }

  const meetingsFingerprint = teamMemberMeetingsFingerprint(input.meetings);
  const scopeKey = sellerAffinityScopeKey(input.sellerUserId, input.statsWindowDays);

  return readThroughAiSummaryCache(deps, {
    organizationId: input.organizationId,
    scopeKey,
    meetingsFingerprint,
    compute: async () => {
      const [affinityPrompt, affinityModel] = await Promise.all([
        loadAnalysisPromptMarkdown(deps.prompts, "SELLER_AFFINITY"),
        resolvePromptGatewayModel(deps.prompts, "SELLER_AFFINITY"),
      ]);
      try {
        return await deps.analysis.summarizeSellerRelationalAffinity({
          sellerDisplayName: input.sellerDisplayName,
          meetings: meetingDigests,
          systemMarkdown: affinityPrompt,
          model: affinityModel,
        });
      } catch {
        return null;
      }
    },
  });
}
