import type { PrismaClient } from "@/lib/generated/prisma/client";
import { ANALYSIS_REUSE_SCOPE_PREFIX } from "@/src/core/domain/analysis-reuse-key";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export class PrismaAiSummaryCacheRepository implements AiSummaryCacheRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async get(input: {
    organizationId: string;
    scopeKey: string;
    meetingsFingerprint: string;
  }): Promise<unknown | null> {
    const row = await this.db.aiSummaryCache.findUnique({
      where: {
        organizationId_scopeKey_meetingsFingerprint: {
          organizationId: input.organizationId,
          scopeKey: input.scopeKey,
          meetingsFingerprint: input.meetingsFingerprint,
        },
      },
      select: { payload: true },
    });
    return row?.payload ?? null;
  }

  async set(input: {
    organizationId: string;
    scopeKey: string;
    meetingsFingerprint: string;
    payload: unknown;
  }): Promise<void> {
    await this.db.aiSummaryCache.upsert({
      where: {
        organizationId_scopeKey_meetingsFingerprint: {
          organizationId: input.organizationId,
          scopeKey: input.scopeKey,
          meetingsFingerprint: input.meetingsFingerprint,
        },
      },
      create: {
        organizationId: input.organizationId,
        scopeKey: input.scopeKey,
        meetingsFingerprint: input.meetingsFingerprint,
        payload: input.payload as object,
      },
      update: {
        payload: input.payload as object,
      },
    });
  }

  /**
   * Vide les synthèses de l'organisation, sauf les analyses de rendez-vous
   * gardées pour être rendues à l'identique : elles ne dépendent que de leur
   * transcript et de leur consigne, qu'aucun nouveau rendez-vous ne change.
   */
  async invalidateForOrganization(organizationId: string): Promise<void> {
    await this.db.aiSummaryCache.deleteMany({
      where: {
        organizationId,
        NOT: { scopeKey: { startsWith: ANALYSIS_REUSE_SCOPE_PREFIX } },
      },
    });
  }
}
