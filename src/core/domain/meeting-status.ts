export const MEETING_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export function isMeetingStatus(value: string): value is MeetingStatus {
  return (MEETING_STATUSES as readonly string[]).includes(value);
}

export const MEETING_SOURCE_TYPES = ["UPLOAD", "TRANSCRIPT"] as const;
export type MeetingSourceType = (typeof MEETING_SOURCE_TYPES)[number];
