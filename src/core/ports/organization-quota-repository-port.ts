export interface OrganizationQuotaRepositoryPort {
  getTrialAnalysesLeft(organizationId: string): Promise<number>;

  decrementTrialAnalysesLeft(organizationId: string): Promise<number | null>;

  setTrialAnalysesLeft(input: {
    organizationId: string;
    trialAnalysesLeft: number;
  }): Promise<void>;
}
