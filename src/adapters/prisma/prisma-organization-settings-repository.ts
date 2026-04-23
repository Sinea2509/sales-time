import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type {
  OrganizationSettingsRepositoryPort,
  OrganizationSettingsRow,
} from "@/src/core/ports/organization-settings-repository-port";

function mapRow(row: {
  id: string;
  organizationId: string;
  companyName: string | null;
  industrySector: string | null;
  commercialTeamSize: string | null;
  averageSalesCycle: string | null;
  averageDealSize: string | null;
  companyPitch: string | null;
  objections: unknown;
  keyArguments: unknown;
  industryVocabulary: string | null;
  meetingTypes: unknown;
  pipelineStages: unknown;
}): OrganizationSettingsRow {
  return {
    id: row.id,
    organizationId: row.organizationId,
    companyName: row.companyName,
    industrySector: row.industrySector,
    commercialTeamSize: row.commercialTeamSize,
    averageSalesCycle: row.averageSalesCycle,
    averageDealSize: row.averageDealSize,
    companyPitch: row.companyPitch,
    objections: row.objections,
    keyArguments: row.keyArguments,
    industryVocabulary: row.industryVocabulary,
    meetingTypes: row.meetingTypes,
    pipelineStages: row.pipelineStages,
  };
}

export class PrismaOrganizationSettingsRepository
  implements OrganizationSettingsRepositoryPort
{
  constructor(private readonly db: PrismaClient) {}

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationSettingsRow | null> {
    const row = await this.db.organizationSettings.findUnique({
      where: { organizationId },
    });
    return row ? mapRow(row) : null;
  }

  async upsertContextFields(
    organizationId: string,
    fields: {
      companyName: string | null;
      industrySector: string | null;
      commercialTeamSize: string | null;
      averageSalesCycle: string | null;
      averageDealSize: string | null;
    },
  ): Promise<void> {
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...fields },
      update: fields,
    });
  }

  async upsertCoachFields(
    organizationId: string,
    fields: {
      companyPitch: string | null;
      objections: unknown;
      keyArguments: unknown;
      industryVocabulary: string | null;
    },
  ): Promise<void> {
    const jsonFields = {
      companyPitch: fields.companyPitch,
      objections: fields.objections as Prisma.InputJsonValue,
      keyArguments: fields.keyArguments as Prisma.InputJsonValue,
      industryVocabulary: fields.industryVocabulary,
    };
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...jsonFields },
      update: jsonFields,
    });
  }

  async upsertProcessFields(
    organizationId: string,
    fields: {
      meetingTypes: unknown;
      pipelineStages: unknown;
    },
  ): Promise<void> {
    const jsonFields = {
      meetingTypes: fields.meetingTypes as Prisma.InputJsonValue,
      pipelineStages: fields.pipelineStages as Prisma.InputJsonValue,
    };
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...jsonFields },
      update: jsonFields,
    });
  }
}
