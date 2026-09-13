import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { aiSummaryCacheFingerprint } from "@/src/core/application/ai-summary-cache-fingerprint";
import { orgKissRollupScopeKey } from "@/src/core/application/ai-summary-cache-scopes";
import {
  composeAnalysisSystemMarkdown,
  synthesisContextBlocks,
} from "@/src/core/domain/analysis-system-markdown";
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
    /** Bloc playbook de l'organisation, tel que le reçoit une analyse de RDV. */
    organizationPlaybookMarkdown?: string | null;
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

  /*
    Les blocs sont calculés une fois et servent deux fois : à écrire le prompt,
    et à l'empreinte sous laquelle le texte produit sera relu. Les séparer
    laisserait la porte ouverte à une clé qui ignore un bloc que le prompt
    contient, ce qui est exactement le défaut corrigé ici.
  */
  const contextBlocks = synthesisContextBlocks(input);

  return readThroughAiSummaryCache(deps, {
    organizationId: input.organizationId,
    scopeKey,
    meetingsFingerprint: aiSummaryCacheFingerprint({
      meetingsFingerprint: input.meetingsFingerprint,
      promptContext: contextBlocks,
    }),
    compute: async () => {
      try {
        const basePrompt = await loadAnalysisPromptMarkdown(
          deps.prompts,
          "ORG_KISS_ROLLUP",
        );
        const systemMarkdown = composeAnalysisSystemMarkdown(
          basePrompt,
          contextBlocks,
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
