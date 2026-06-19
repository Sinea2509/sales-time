import type { MeetingStatus } from "./meeting-status";

export const MEETING_PROCESSING_STUCK_MS = 15 * 60 * 1000;

export function isMeetingAnalysisStuck(input: {
  status: MeetingStatus;
  analysisCount: number;
  updatedAt: Date;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  return (
    input.status === "PROCESSING" &&
    input.analysisCount === 0 &&
    now - input.updatedAt.getTime() > MEETING_PROCESSING_STUCK_MS
  );
}
