import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

/** Stable signature for meetings in the stats window: changes on add/remove/analysis status. */
export function teamMemberMeetingsFingerprint(
  meetings: RecentMeetingListRow[],
): string {
  return meetings
    .map((m) => `${m.id}:${m.status}:${m.updatedAt.toISOString()}`)
    .sort()
    .join("|");
}
