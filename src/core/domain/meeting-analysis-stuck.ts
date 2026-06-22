import type { MeetingStatus } from "./meeting-status";

/** Show retry UI after this delay while still PROCESSING. */
export const MEETING_PROCESSING_SLOW_MS = 3 * 60 * 1000;

/** Stuck banner after this delay (no status change). */
export const MEETING_PROCESSING_STUCK_MS = 15 * 60 * 1000;

// Related worker threshold (see process-analysis-jobs RECONCILE_MINUTES = 2):
// reconcile re-enqueues PROCESSING meetings when a job run happens (after() or daily cron).

export function isMeetingAnalysisSlow(input: {
  status: MeetingStatus;
  updatedAt: Date;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  return (
    input.status === "PROCESSING" &&
    now - input.updatedAt.getTime() > MEETING_PROCESSING_SLOW_MS
  );
}

export function isMeetingAnalysisStuck(input: {
  status: MeetingStatus;
  updatedAt: Date;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  return (
    input.status === "PROCESSING" &&
    now - input.updatedAt.getTime() > MEETING_PROCESSING_STUCK_MS
  );
}
