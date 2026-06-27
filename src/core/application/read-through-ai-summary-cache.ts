import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export async function readThroughAiSummaryCache<T>(
  deps: { aiSummaryCache: AiSummaryCacheRepositoryPort },
  input: {
    organizationId: string;
    scopeKey: string;
    meetingsFingerprint: string;
    compute: () => Promise<T | null>;
  },
): Promise<T | null> {
  const cached = await deps.aiSummaryCache.get({
    organizationId: input.organizationId,
    scopeKey: input.scopeKey,
    meetingsFingerprint: input.meetingsFingerprint,
  });
  if (cached != null) {
    return cached as T;
  }

  const value = await input.compute();
  if (value != null) {
    await deps.aiSummaryCache.set({
      organizationId: input.organizationId,
      scopeKey: input.scopeKey,
      meetingsFingerprint: input.meetingsFingerprint,
      payload: value,
    });
  }
  return value;
}
