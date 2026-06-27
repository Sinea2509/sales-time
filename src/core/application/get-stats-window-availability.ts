import {
  meetingAtSinceForStatsWindow,
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type StatsWindowRdvsCounts = Record<StatsWindowDays, number>;

export async function getStatsWindowRdvsCounts(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string;
    sellerUserId?: string | null;
  },
): Promise<StatsWindowRdvsCounts> {
  const seller =
    input.sellerUserId != null && input.sellerUserId !== ""
      ? input.sellerUserId
      : undefined;

  const entries = await Promise.all(
    STATS_WINDOW_DAYS_OPTIONS.map(async (days) => {
      const count = await deps.meetings.countMeetingsWithMeetingAtSince({
        organizationId: input.organizationId,
        since: meetingAtSinceForStatsWindow(days),
        sellerUserId: seller,
      });
      return [days, count] as const;
    }),
  );

  return Object.fromEntries(entries) as StatsWindowRdvsCounts;
}
