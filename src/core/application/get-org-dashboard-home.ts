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
import { noteGlobaleOn5FromSalesScores } from "@/src/core/domain/note-globale-on5";
import type {
  MeetingRepositoryPort,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";

export type OrgDashboardHome = {
  statsWindowDays: StatsWindowDays;
  /**
   * TAM par RDV (minutes) : temps administratif économisé sur un rendez-vous,
   * d'après les paramètres de l'organisation (CR + CRM + e-mail − résiduel).
   */
  tamMinutesPerRdv: number;
  /** Temps d'appel moyen (min) sur les RDV connectés (durée renseignée). */
  avgDurationMin: number | null;
  /** Somme des durées de conversation utile (RDV connectés) sur la fenêtre. */
  usefulConversationMinutes: number;
  /** Temps de prospection de référence sur la fenêtre (objectif org proratisé). */
  prospectingMinutes: number;
  /**
   * TAM cumulé (minutes) : le gain par RDV multiplié par le nombre de RDV
   * renseignés sur la fenêtre. C'est bien du temps administratif économisé, et
   * non du temps de conversation, que ce champ porte.
   */
  tamCumuleMinutes: number;
  /** RDV avec durée renseignée (> 0 min) sur la fenêtre. */
  nbRdvsRenseignes: number;
  nbRdvs: number;
  /** TUC optimisé = conversation utile / temps de prospection (objectif org proratisé). */
  tucOptimisePercent: number | null;
  /** Variation du temps d'appel moyen vs fenêtre précédente (%). */
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
  /** RDV avec SalesScore (SONCAS) sur la fenêtre, base du gating de la tendance de note globale. */
  noteGlobaleSampleCount: number;
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

function noteGlobaleOn5ForMeetings(
  meetings: RecentMeetingListRow[],
): number | null {
  const scores = meetings
    .map((m) => m.salesScore)
    .filter((s): s is number => s != null);
  return noteGlobaleOn5FromSalesScores(scores);
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

  const usefulConversationMinutes =
    sumUsefulConversationMinutes(currentDurations);
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
  const noteGlobaleSampleCount = kpiMeetingsCurrent.filter(
    (m) => m.salesScore != null,
  ).length;

  const nbRdvsTrendPercent = percentChangeVsPrevious(nbRdvs, nbRdvsPrev);
  const nbRdvsRenseignesTrendPercent = percentChangeVsPrevious(
    nbRdvsRenseignes,
    nbRdvsRenseignesPrev,
  );
  // Le TAM cumulé, c'est le gain administratif par RDV répété sur les RDV
  // renseignés de la fenêtre. Il portait jusqu'ici la somme des durées de
  // conversation, c'est-à-dire l'exact contraire de ce que son libellé promet :
  // le temps passé à parler, présenté comme du temps économisé. Un prospect à
  // qui l'on démontre le produit lisait donc « vous avez gagné 31 h » devant un
  // nombre qui mesurait ses heures d'appel.
  //
  // Le gain par RDV est constant sur les deux fenêtres, si bien que la variation
  // du cumul est celle du nombre de RDV renseignés. Elle est calculée
  // explicitement plutôt que déduite, pour que la lecture ne dépende pas de ce
  // rapprochement.
  const tamCumuleMinutes = tamMinutesPerRdv * nbRdvsRenseignes;
  const tamCumuleTrendPercent = percentChangeVsPrevious(
    tamCumuleMinutes,
    tamMinutesPerRdv * nbRdvsRenseignesPrev,
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
    prospectingMinutes,
    tamCumuleMinutes,
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
    noteGlobaleSampleCount,
    recentMeetings,
  };
}
