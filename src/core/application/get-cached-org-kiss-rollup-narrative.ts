import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import {
  appendOrganizationKissPromptAppendix,
  loadAnalysisPromptMarkdown,
} from "@/lib/load-analysis-prompt";
import { orgKissRollupScopeKey } from "@/src/core/application/ai-summary-cache-scopes";
import { readThroughAiSummaryCache } from "@/src/core/application/read-through-ai-summary-cache";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type {
  AnalysisPort,
  OrgKissRollupForSummary,
} from "@/src/core/ports/analysis-port";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

type Deps = {
  analysis: AnalysisPort;
  prompts: PromptTemplateRepositoryPort;
  aiSummaryCache: AiSummaryCacheRepositoryPort;
};

export async function getCachedOrgKissRollupNarrative(
  deps: Deps,
  input: {
    organizationId: string;
    statsWindowDays: StatsWindowDays;
    meetingsFingerprint: string;
    rollup: OrgKissRollupForSummary;
    organizationKissPromptAppendix?: string | null;
    sellerUserId?: string | null;
    /**
     * À qui ce texte s'adresse. Obligatoire, et non pas défaut « manager » :
     * l'annexe passée au prompt juste en dessous en dépend, et un appelant qui
     * oublierait de le dire écrirait dans le cache de l'autre lecteur.
     */
    audience: "manager" | "commercial";
  },
): Promise<string | null> {
  if (!getEnv().AI_GATEWAY_API_KEY) {
    return null;
  }

  const scopeKey = orgKissRollupScopeKey({
    statsWindowDays: input.statsWindowDays,
    sellerUserId: input.sellerUserId,
    audience: input.audience,
  });

  return readThroughAiSummaryCache(deps, {
    organizationId: input.organizationId,
    scopeKey,
    meetingsFingerprint: input.meetingsFingerprint,
    compute: async () => {
      try {
        const basePrompt = await loadAnalysisPromptMarkdown(
          deps.prompts,
          "ORG_KISS_ROLLUP",
        );
        const systemMarkdown = appendOrganizationKissPromptAppendix(
          basePrompt,
          input.organizationKissPromptAppendix,
        );
        const model = await resolvePromptGatewayModel(deps.prompts, "ORG_KISS_ROLLUP");
        const narrative = await deps.analysis.summarizeOrgKissRollup({
          systemMarkdown,
          rollup: input.rollup,
          model,
        });
        const trimmed = narrative.trim();
        return trimmed.length > 0 ? trimmed : null;
      } catch {
        return null;
      }
    },
  });
}
