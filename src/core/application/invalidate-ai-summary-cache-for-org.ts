import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export async function invalidateAiSummaryCacheForOrg(
  deps: { aiSummaryCache: AiSummaryCacheRepositoryPort },
  organizationId: string,
): Promise<void> {
  await deps.aiSummaryCache.invalidateForOrganization(organizationId);
}
