export type AiSummaryCacheEntry = {
  organizationId: string;
  scopeKey: string;
  meetingsFingerprint: string;
  payload: unknown;
};

export interface AiSummaryCacheRepositoryPort {
  get(input: {
    organizationId: string;
    scopeKey: string;
    meetingsFingerprint: string;
  }): Promise<unknown | null>;

  set(input: AiSummaryCacheEntry): Promise<void>;

  invalidateForOrganization(organizationId: string): Promise<void>;
}
