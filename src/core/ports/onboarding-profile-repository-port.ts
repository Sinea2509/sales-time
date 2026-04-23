export interface OnboardingProfileRepositoryPort {
  getOrCreateProfileForUserId(
    userId: string,
  ): Promise<{ id: string; currentStep: number }>;

  updateAfterStep1(
    userId: string,
    data: {
      companyName: string;
      industrySector: string | null;
      commercialTeamSize: string | null;
      averageSalesCycle: string | null;
      averageDealSize: string | null;
    },
  ): Promise<void>;

  updateAfterStep2(
    userId: string,
    data: {
      companyPitch: string | null;
      objections: unknown;
      keyArguments: unknown;
      industryVocabulary: string | null;
    },
  ): Promise<void>;

  updateAfterStep3(
    userId: string,
    data: {
      meetingTypes: unknown;
      pipelineStages: unknown;
    },
  ): Promise<void>;

  completeStep4(
    userId: string,
    data: {
      inviteEmails: unknown;
      inviteMessage: string | null;
    },
  ): Promise<void>;
}
