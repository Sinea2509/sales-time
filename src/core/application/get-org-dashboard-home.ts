import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import {
  averageTamMinutes,
  countConnectedMeetings,
  prospectingMinutesForStatsWindow,
  sumUsefulConversationMinutes,
  tucOptimisePercent,
} from "@/src/core/domain/dashboard-tam-tuc";
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
  /** Gain estimé par RDV (minutes) — paramètres org (CR, CRM, e-mail, résiduel). */
  tamMinutesPerRdv: number;
  /** TAM — temps d'appel moyen (min) sur les RDV connectés (durée renseignée). */
  avgDurationMin: number | null;
  /** Somme des durées de conversation utile (RDV connectés) sur la fenêtre. */
  usefulConversationMinutes: number;
  /** TAM cumulé — même valeur que usefulConversationMinutes (libellé Performance). */
  tamCumuleMinutes: number;
  /** RDV avec durée renseignée (> 0 min) sur la fenêtre. */
  nbRdvsRenseignes: number;
  nbRdvs: number;
  /** TUC optimisé = conversation utile / temps de prospection (objectif org proratisé). */
  tucOptimisePercent: number | null;
  /** Variation TAM vs fenêtre précédente (%). */
  tamTrendPercent: number | null;
  /** Variation TAM cumulé vs fenêtre précédente (%). */
  tamCumuleTrendPercent: number | null;
  nbRdvsTrendPercent: number | null;
  nbRdvsRenseignesTrendPercent: number | null;
  /** Écart en points de pourcentage du TUC vs période précédente. */
  tucTrendPoints: number | null;
  avgDurationTrendPercent: number | null;
  /** Note globale /5 (moyenne SalesScore /100 ÷ 20, arrondi 0.1), null si aucune analyse. */
  noteGlobaleOn5: number | null;
  noteGlobaleTrendPoints: number | null;
  /** Variation % de la note globale vs période précédente. */
  noteGlobaleTrendPercent: number | null;
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

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
  const prospectingMinutes = prospectingMinutesForStatsWindow(
    orgSettings?.tamObjectiveMinutesPerMonth ?? 180,
    input.statsWindowDays,
  );

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

  const currentDurations = kpiMeetingsCurrent.map((m) => m.durationMin);
  const prevDurations = kpiMeetingsPrev.map((m) => m.durationMin);

  const usefulConversationMinutes = sumUsefulConversationMinutes(currentDurations);
  const usefulConversationPrev = sumUsefulConversationMinutes(prevDurations);
  const nbRdvsRenseignes = countConnectedMeetings(currentDurations);
  const nbRdvsRenseignesPrev = countConnectedMeetings(prevDurations);

  const tucOptimisePercentValue = tucOptimisePercent(
    usefulConversationMinutes,
    prospectingMinutes,
  );
  const tucPrevPercent = tucOptimisePercent(
    usefulConversationPrev,
    prospectingMinutes,
  );

  const avgDurationFromMeetings = averageTamMinutes(
    kpiMeetingsCurrent.map((m) => m.durationMin),
  );
  const avgDurationPrevFromMeetings = averageTamMinutes(
    kpiMeetingsPrev.map((m) => m.durationMin),
  );
  const avgDurationMinResolved = avgDurationMin ?? avgDurationFromMeetings;
  const avgDurationPrevResolved =
    avgDurationPrev ?? avgDurationPrevFromMeetings;

  const noteGlobaleOn5 = noteGlobaleOn5ForMeetings(kpiMeetingsCurrent);
  const noteGlobalePrevOn5 = noteGlobaleOn5ForMeetings(kpiMeetingsPrev);

  const nbRdvsTrendPercent = percentChangeVsPrevious(nbRdvs, nbRdvsPrev);
  const nbRdvsRenseignesTrendPercent = percentChangeVsPrevious(
    nbRdvsRenseignes,
    nbRdvsRenseignesPrev,
  );
  const tamCumuleTrendPercent = percentChangeVsPrevious(
    usefulConversationMinutes,
    usefulConversationPrev,
  );
  const tamTrendPercent =
    avgDurationMinResolved != null
      ? percentChangeVsPrevious(
          avgDurationMinResolved,
          avgDurationPrevResolved ?? 0,
        )
      : null;

  const tucTrendPoints =
    tucOptimisePercentValue != null && tucPrevPercent != null
      ? Math.round((tucOptimisePercentValue - tucPrevPercent) * 10) / 10
      : null;

  const avgDurationTrendPercent = tamTrendPercent;

  const noteGlobaleTrendPoints =
    noteGlobaleOn5 != null && noteGlobalePrevOn5 != null
      ? Math.round((noteGlobaleOn5 - noteGlobalePrevOn5) * 10) / 10
      : null;

  const noteGlobaleTrendPercent =
    noteGlobaleOn5 != null
      ? percentChangeVsPrevious(noteGlobaleOn5, noteGlobalePrevOn5 ?? 0)
      : null;

  return {
    statsWindowDays: input.statsWindowDays,
    tamMinutesPerRdv,
    avgDurationMin: avgDurationMinResolved,
    usefulConversationMinutes,
    tamCumuleMinutes: usefulConversationMinutes,
    nbRdvsRenseignes,
    nbRdvs,
    tucOptimisePercent: tucOptimisePercentValue,
    tamTrendPercent,
    tamCumuleTrendPercent,
    nbRdvsTrendPercent,
    nbRdvsRenseignesTrendPercent,
    tucTrendPoints,
    avgDurationTrendPercent,
    noteGlobaleOn5,
    noteGlobaleTrendPoints,
    noteGlobaleTrendPercent,
    recentMeetings,
  };
}
