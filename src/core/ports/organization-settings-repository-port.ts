export type OrganizationSettingsRow = {
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
};

export interface OrganizationSettingsRepositoryPort {
  findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationSettingsRow | null>;

  upsertContextFields(
    organizationId: string,
    fields: {
      companyName: string | null;
      industrySector: string | null;
      commercialTeamSize: string | null;
      averageSalesCycle: string | null;
      averageDealSize: string | null;
    },
  ): Promise<void>;

  upsertCoachFields(
    organizationId: string,
    fields: {
      companyPitch: string | null;
      objections: unknown;
      keyArguments: unknown;
      industryVocabulary: string | null;
    },
  ): Promise<void>;

  upsertProcessFields(
    organizationId: string,
    fields: {
      meetingTypes: unknown;
      pipelineStages: unknown;
    },
  ): Promise<void>;

  upsertEmailFields(
    organizationId: string,
    fields: {
      emailTone: string | null;
      emailVouvoiement: boolean;
      emailSignature: string | null;
    },
  ): Promise<void>;

  upsertLogoUrl(organizationId: string, logoUrl: string | null): Promise<void>;
}
