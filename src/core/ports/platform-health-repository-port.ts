export type AdminHealthCounts = {
  userCount: number;
  orgCount: number;
  meetingCount: number;
  analysisCount: number;
  sessionCount: number;
  activeSessions: number;
  expiredSessions: number;
  pendingOrgInvitations: number;
  pendingSuperAdminInvitations: number;
};

export type AnalysisPipelineHealth = {
  jobsQueued: number;
  jobsProcessing: number;
  jobsDead: number;
  meetingsProcessingStuck: number;
};

export interface PlatformHealthRepositoryPort {
  pingSelectOne(): Promise<void>;

  measureSelectOneLatency(): Promise<{ ok: boolean; ms: number }>;

  getAdminHealthCounts(now: Date): Promise<AdminHealthCounts>;

  getAnalysisPipelineHealth(now: Date): Promise<AnalysisPipelineHealth>;
}
