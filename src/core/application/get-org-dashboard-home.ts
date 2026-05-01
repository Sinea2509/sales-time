import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { percentChangeVsPrevious } from "@/src/core/domain/dashboard-trend";
import {
  meetingAtSinceForStatsWindow,
  previousMeetingAtWindowStart,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type {
  MeetingRepositoryPort,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";

export type OrgDashboardHome = {
  statsWindowDays: StatsWindowDays;
  /** Temps utile cumulé (minutes) sur la fenêtre : nb RDV × minutes/RDV (paramètres org). */
  tamCumuleMinutes: number;
  /** Minutes de TAM estimées par RDV selon les paramètres organisation. */
  tamMinutesPerRdv: number;
  nbRdvs: number;
  tucOptimisePercent: number | null;
  /** Moyenne durée RDV (min) sur la fenêtre, si renseignée. */
  avgDurationMin: number | null;
  tamTrendPercent: number | null;
  nbRdvsTrendPercent: number | null;
  /** Écart en points de pourcentage du TUC vs période précédente (TUC est déjà un %). */
  tucTrendPoints: number | null;
  avgDurationTrendPercent: number | null;
  /** Note globale /5 (moyenne SalesScore /100 ÷ 20, arrondi 0.1), null si aucune analyse. */
  noteGlobaleOn5: number | null;
  noteGlobaleTrendPoints: number | null;
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

function tucPercentForMeetings(
  meetings: RecentMeetingListRow[],
): number | null {
  if (meetings.length === 0) return null;
  const withBoth = meetings.filter((m) => m.hasSoncas && m.hasDisc).length;
  return Math.round((100 * withBoth) / meetings.length);
}

function noteGlobaleOn5ForMeetings(
  meetings: RecentMeetingListRow[],
): number | null {
  const scores = meetings
    .map((m) => m.salesScore)
    .filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  return Math.round((avg / 20) * 10) / 10;
}

export async function getOrgDashboardHome(
  deps: {
    meetings: MeetingRepositoryPort;
    organizationSettings: OrganizationSettingsRepositoryPort;
  },
  input: {
    organizationId: string | null;
    statsWindowDays: StatsWindowDays;
    /** When set, KPIs and recent meetings are scoped to this seller (member role). */
    sellerUserId?: string | null;
  },
): Promise<OrgDashboardHome | null> {
  if (!input.organizationId) return null;

  const orgSettings = await deps.organizationSettings.findByOrganizationId(
    input.organizationId,
  );
  const tamMinutesPerRdv = tamMinutesSavedPerMeetingFromSettings(orgSettings);

  const sinceCurrent = meetingAtSinceForStatsWindow(input.statsWindowDays);
  const sincePrev = previousMeetingAtWindowStart(input.statsWindowDays);
  const seller =
    input.sellerUserId != null && input.sellerUserId !== ""
      ? input.sellerUserId
      : undefined;

  const [
    nbRdvs,
    nbRdvsPrev,
    avgDurationMin,
    avgDurationPrev,
    kpiMeetingsCurrent,
    kpiMeetingsPrev,
    recentMeetings,
  ] = await Promise.all([
    deps.meetings.countMeetingsWithMeetingAtSince({
      organizationId: input.organizationId,
      since: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.countMeetingsWithMeetingAtBetween({
      organizationId: input.organizationId,
      meetingAtGte: sincePrev,
      meetingAtLt: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.averageDurationMinForMeetingsInWindow({
      organizationId: input.organizationId,
      meetingAtGte: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.averageDurationMinForMeetingsInWindow({
      organizationId: input.organizationId,
      meetingAtGte: sincePrev,
      meetingAtLt: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      meetingAtSince: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      meetingAtSince: sincePrev,
      meetingAtBefore: sinceCurrent,
      sellerUserId: seller,
    }),
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: input.organizationId,
      limit: RECENT_LIMIT,
      meetingAtSince: sinceCurrent,
      sellerUserId: seller,
    }),
  ]);

  const tamCumuleMinutes = nbRdvs * tamMinutesPerRdv;
  const tamPrevMinutes = nbRdvsPrev * tamMinutesPerRdv;

  const tucOptimisePercent = tucPercentForMeetings(kpiMeetingsCurrent);
  const tucPrevPercent = tucPercentForMeetings(kpiMeetingsPrev);

  const noteGlobaleOn5 = noteGlobaleOn5ForMeetings(kpiMeetingsCurrent);
  const noteGlobalePrevOn5 = noteGlobaleOn5ForMeetings(kpiMeetingsPrev);

  const nbRdvsTrendPercent = percentChangeVsPrevious(nbRdvs, nbRdvsPrev);
  const tamTrendPercent = percentChangeVsPrevious(
    tamCumuleMinutes,
    tamPrevMinutes,
  );

  const tucTrendPoints =
    tucOptimisePercent != null && tucPrevPercent != null
      ? Math.round((tucOptimisePercent - tucPrevPercent) * 10) / 10
      : null;

  const avgDurationTrendPercent =
    avgDurationMin != null && avgDurationPrev != null
      ? percentChangeVsPrevious(avgDurationMin, avgDurationPrev)
      : null;

  const noteGlobaleTrendPoints =
    noteGlobaleOn5 != null && noteGlobalePrevOn5 != null
      ? Math.round((noteGlobaleOn5 - noteGlobalePrevOn5) * 10) / 10
      : null;

  return {
    statsWindowDays: input.statsWindowDays,
    tamCumuleMinutes,
    tamMinutesPerRdv,
    nbRdvs,
    tucOptimisePercent,
    avgDurationMin,
    tamTrendPercent,
    nbRdvsTrendPercent,
    tucTrendPoints,
    avgDurationTrendPercent,
    noteGlobaleOn5,
    noteGlobaleTrendPoints,
    recentMeetings,
  };
}
