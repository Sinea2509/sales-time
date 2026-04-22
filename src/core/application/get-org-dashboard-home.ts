import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import {
  meetingAtSinceForStatsWindow,
  type StatsWindowDays,
} from "@/lib/dashboard-stats-window";
import type {
  MeetingRepositoryPort,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";

export type OrgDashboardHome = {
  statsWindowDays: StatsWindowDays;
  tamCumuleEur: number;
  nbRdvs: number;
  tucOptimisePercent: number | null;
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

export async function getOrgDashboardHome(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    clerkOrgId: string | null;
    statsWindowDays: StatsWindowDays;
  },
): Promise<OrgDashboardHome | null> {
  if (!input.clerkOrgId) return null;

  const since = meetingAtSinceForStatsWindow(input.statsWindowDays);

  const [nbRdvs, recentMeetings] = await Promise.all([
    deps.meetings.countMeetingsWithMeetingAtSince({
      clerkOrgId: input.clerkOrgId,
      since,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: input.clerkOrgId,
      limit: RECENT_LIMIT,
      meetingAtSince: since,
    }),
  ]);

  const tamCumuleEur = nbRdvs * ESTIMATED_TAM_EUR_PER_RDV;

  const withBoth = recentMeetings.filter((m) => m.hasSoncas && m.hasDisc)
    .length;
  const tucOptimisePercent =
    recentMeetings.length === 0
      ? null
      : Math.round((100 * withBoth) / recentMeetings.length);

  return {
    statsWindowDays: input.statsWindowDays,
    tamCumuleEur,
    nbRdvs,
    tucOptimisePercent,
    recentMeetings,
  };
}
