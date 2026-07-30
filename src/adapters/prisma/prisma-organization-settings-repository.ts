import { Prisma } from "@/lib/generated/prisma/client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  OrganizationSettingsRepositoryPort,
  OrganizationSettingsRow,
} from "@/src/core/ports/organization-settings-repository-port";

function mapRow(row: {
  id: string;
  organizationId: string;
  companyName: string | null;
  logoUrl: string | null;
  industrySector: string | null;
  commercialTeamSize: string | null;
  averageSalesCycle: string | null;
  averageDealSize: string | null;
  companyPitch: string | null;
  objections: unknown;
  keyArguments: unknown;
  industryVocabulary: string | null;
  kissCoachingPrompts: unknown | null;
  playbook: unknown | null;
  meetingTypes: unknown;
  pipelineStages: unknown;
  emailTone: string | null;
  emailVouvoiement: boolean;
  emailSignature: string | null;
  tamCrMinutes: number;
  tamCrmMinutes: number;
  tamEmailMinutes: number;
  tamResidualMinutes: number;
  tamObjectiveMinutesPerMonth: number;
}): OrganizationSettingsRow {
  return {
    id: row.id,
    organizationId: row.organizationId,
    companyName: row.companyName,
    logoUrl: row.logoUrl,
    industrySector: row.industrySector,
    commercialTeamSize: row.commercialTeamSize,
    averageSalesCycle: row.averageSalesCycle,
    averageDealSize: row.averageDealSize,
    companyPitch: row.companyPitch,
    objections: row.objections,
    keyArguments: row.keyArguments,
    industryVocabulary: row.industryVocabulary,
    kissCoachingPrompts: row.kissCoachingPrompts ?? null,
    playbook: row.playbook ?? null,
    meetingTypes: row.meetingTypes,
    pipelineStages: row.pipelineStages,
    emailTone: row.emailTone,
    emailVouvoiement: row.emailVouvoiement,
    emailSignature: row.emailSignature,
    tamCrMinutes: row.tamCrMinutes,
    tamCrmMinutes: row.tamCrmMinutes,
    tamEmailMinutes: row.tamEmailMinutes,
    tamResidualMinutes: row.tamResidualMinutes,
    tamObjectiveMinutesPerMonth: row.tamObjectiveMinutesPerMonth,
  };
}

export class PrismaOrganizationSettingsRepository implements OrganizationSettingsRepositoryPort {
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
      kissCoachingPrompts?: unknown | null;
    },
  ): Promise<void> {
    const base = {
      companyPitch: fields.companyPitch,
      objections: fields.objections as Prisma.InputJsonValue,
      keyArguments: fields.keyArguments as Prisma.InputJsonValue,
      industryVocabulary: fields.industryVocabulary,
    };
    const kissUpdate =
      fields.kissCoachingPrompts === undefined
        ? {}
        : {
            kissCoachingPrompts:
              fields.kissCoachingPrompts === null
                ? Prisma.DbNull
                : (fields.kissCoachingPrompts as Prisma.InputJsonValue),
          };
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...base,
        ...kissUpdate,
      },
      update: { ...base, ...kissUpdate },
    });
  }

  async upsertPlaybook(
    organizationId: string,
    playbook: unknown,
  ): Promise<void> {
    /*
      Un playbook entièrement vide vaut `null` côté domaine. Il faut alors
      effacer la colonne, pas y écrire le JSON `null`, sans quoi la lecture
      distinguerait deux vides différents. `Prisma.DbNull` dit bien : la
      colonne redevient NULL.
    */
    const value =
      playbook === null || playbook === undefined
        ? Prisma.DbNull
        : (playbook as Prisma.InputJsonValue);
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, playbook: value },
      update: { playbook: value },
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

  async upsertEmailFields(
    organizationId: string,
    fields: {
      emailTone: string | null;
      emailVouvoiement: boolean;
      emailSignature: string | null;
    },
  ): Promise<void> {
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...fields },
      update: fields,
    });
  }

  async upsertLogoUrl(
    organizationId: string,
    logoUrl: string | null,
  ): Promise<void> {
    await this.db.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId, logoUrl },
      update: { logoUrl },
    });
  }
}
