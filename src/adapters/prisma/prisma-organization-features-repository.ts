import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OrganizationFeaturesRepositoryPort } from "@/src/core/ports/organization-features-repository-port";

export class PrismaOrganizationFeaturesRepository implements OrganizationFeaturesRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async listEnabledFeatures(organizationId: string): Promise<string[]> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { enabledFeatures: true },
    });
    return org?.enabledFeatures ?? [];
  }

  async setFeature(input: {
    organizationId: string;
    feature: string;
    enabled: boolean;
  }): Promise<void> {
    const current = await this.listEnabledFeatures(input.organizationId);
    const next = input.enabled
      ? [...new Set([...current, input.feature])]
      : current.filter((f) => f !== input.feature);
    await this.db.organization.update({
      where: { id: input.organizationId },
      data: { enabledFeatures: next },
    });
  }
}
