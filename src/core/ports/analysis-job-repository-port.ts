export type AnalysisJobRow = {
  id: string;
  organizationId: string;
  meetingId: string;
  jobType: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED" | "DEAD";
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
};

export interface AnalysisJobRepositoryPort {
  enqueueMeetingAnalysis(input: {
    organizationId: string;
    meetingId: string;
    priority?: number;
  }): Promise<AnalysisJobRow>;

  /** Atomically claim the next queued job (SKIP LOCKED). */
  dequeueNextJob(workerId: string): Promise<AnalysisJobRow | null>;

  markJobDone(jobId: string): Promise<void>;

  markJobFailed(input: {
    jobId: string;
    error: string;
    requeue: boolean;
    runAfter?: Date;
  }): Promise<void>;

  releaseStaleProcessingJobs(staleBefore: Date): Promise<number>;

  /** Re-enqueue meetings stuck in PROCESSING with no active job. */
  reconcileStuckProcessingMeetings(input: {
    staleBefore: Date;
    limit: number;
  }): Promise<number>;
}
