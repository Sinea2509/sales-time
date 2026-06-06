import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";

export class PrismaOrganizationQuotaRepository implements OrganizationQuotaRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async getTrialAnalysesLeft(organizationId: string): Promise<number> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { trialAnalysesLeft: true },
    });
    return org?.trialAnalysesLeft ?? 0;
  }

  async decrementTrialAnalysesLeft(organizationId: string): Promise<number | null> {
    const org = await this.db.organization.update({
      where: { id: organizationId },
      data: { trialAnalysesLeft: { decrement: 1 } },
      select: { trialAnalysesLeft: true },
    });
    return org.trialAnalysesLeft;
  }

  async setTrialAnalysesLeft(input: {
    organizationId: string;
    trialAnalysesLeft: number;
  }): Promise<void> {
    await this.db.organization.update({
      where: { id: input.organizationId },
      data: { trialAnalysesLeft: Math.max(0, input.trialAnalysesLeft) },
    });
  }
}
