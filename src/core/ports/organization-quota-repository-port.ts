export interface OrganizationQuotaRepositoryPort {
  getTrialAnalysesLeft(organizationId: string): Promise<number>;

  isPlanUnlocked(organizationId: string): Promise<boolean>;

  unlockPlan(organizationId: string): Promise<void>;

  /** Remet l'organisation sur ses analyses d'essai restantes. */
  lockPlan(organizationId: string): Promise<void>;

  decrementTrialAnalysesLeft(organizationId: string): Promise<number | null>;
}
