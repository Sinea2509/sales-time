import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { percentChangeVsPrevious } from "@/lib/dashboard-trend";
import {
  meetingAtSinceForStatsWindow,
  previousMeetingAtWindowStart,
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
  /** Moyenne durée RDV (min) sur la fenêtre, si renseignée. */
  avgDurationMin: number | null;
  tamTrendPercent: number | null;
  nbRdvsTrendPercent: number | null;
  tucTrendPoints: number | null;
  avgDurationTrendPercent: number | null;
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

function tucPercentForMeetings(meetings: RecentMeetingListRow[]): number | null {
  if (meetings.length === 0) return null;
  const withBoth = meetings.filter((m) => m.hasSoncas && m.hasDisc).length;
  return Math.round((100 * withBoth) / meetings.length);
}

export async function getOrgDashboardHome(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    clerkOrgId: string | null;
    statsWindowDays: StatsWindowDays;
  },
): Promise<OrgDashboardHome | null> {
  if (!input.clerkOrgId) return null;

  const sinceCurrent = meetingAtSinceForStatsWindow(input.statsWindowDays);
  const sincePrev = previousMeetingAtWindowStart(input.statsWindowDays);

  const [
    nbRdvs,
    nbRdvsPrev,
    avgDurationMin,
    avgDurationPrev,
    recentMeetings,
    recentMeetingsPrev,
  ] = await Promise.all([
    deps.meetings.countMeetingsWithMeetingAtSince({
      clerkOrgId: input.clerkOrgId,
      since: sinceCurrent,
    }),
    deps.meetings.countMeetingsWithMeetingAtBetween({
      clerkOrgId: input.clerkOrgId,
      meetingAtGte: sincePrev,
      meetingAtLt: sinceCurrent,
    }),
    deps.meetings.averageDurationMinForMeetingsInWindow({
      clerkOrgId: input.clerkOrgId,
      meetingAtGte: sinceCurrent,
    }),
    deps.meetings.averageDurationMinForMeetingsInWindow({
      clerkOrgId: input.clerkOrgId,
      meetingAtGte: sincePrev,
      meetingAtLt: sinceCurrent,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: input.clerkOrgId,
      limit: RECENT_LIMIT,
      meetingAtSince: sinceCurrent,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      clerkOrgId: input.clerkOrgId,
      limit: RECENT_LIMIT,
      meetingAtSince: sincePrev,
      meetingAtBefore: sinceCurrent,
    }),
  ]);

  const tamCumuleEur = nbRdvs * ESTIMATED_TAM_EUR_PER_RDV;
  const tamPrevEur = nbRdvsPrev * ESTIMATED_TAM_EUR_PER_RDV;

  const tucOptimisePercent = tucPercentForMeetings(recentMeetings);
  const tucPrevPercent = tucPercentForMeetings(recentMeetingsPrev);

  const nbRdvsTrendPercent = percentChangeVsPrevious(nbRdvs, nbRdvsPrev);
  const tamTrendPercent = percentChangeVsPrevious(tamCumuleEur, tamPrevEur);

  const tucTrendPoints =
    tucOptimisePercent != null && tucPrevPercent != null
      ? Math.round((tucOptimisePercent - tucPrevPercent) * 10) / 10
      : null;

  const avgDurationTrendPercent =
    avgDurationMin != null && avgDurationPrev != null
      ? percentChangeVsPrevious(avgDurationMin, avgDurationPrev)
      : null;

  return {
    statsWindowDays: input.statsWindowDays,
    tamCumuleEur,
    nbRdvs,
    tucOptimisePercent,
    avgDurationMin,
    tamTrendPercent,
    nbRdvsTrendPercent,
    tucTrendPoints,
    avgDurationTrendPercent,
    recentMeetings,
  };
}
