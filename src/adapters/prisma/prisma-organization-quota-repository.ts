import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";

export class PrismaOrganizationQuotaRepository implements OrganizationQuotaRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async getTrialAnalysesLeft(organizationId: string): Promise<number> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { trialAnalysesLeft: true, planUnlockedAt: true },
    });
    if (org?.planUnlockedAt) {
      return Number.MAX_SAFE_INTEGER;
    }
    return org?.trialAnalysesLeft ?? 0;
  }

  async isPlanUnlocked(organizationId: string): Promise<boolean> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { planUnlockedAt: true },
    });
    return org?.planUnlockedAt != null;
  }

  async unlockPlan(organizationId: string): Promise<void> {
    await this.db.organization.update({
      where: { id: organizationId },
      data: { planUnlockedAt: new Date() },
    });
  }

  async decrementTrialAnalysesLeft(organizationId: string): Promise<number | null> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { planUnlockedAt: true },
    });
    if (org?.planUnlockedAt) {
      return Number.MAX_SAFE_INTEGER;
    }

    const updated = await this.db.organization.update({
      where: { id: organizationId },
      data: { trialAnalysesLeft: { decrement: 1 } },
      select: { trialAnalysesLeft: true },
    });
    return updated.trialAnalysesLeft;
  }
}
