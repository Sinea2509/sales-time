import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { prospectingMinutesForStatsWindow } from "@/src/core/domain/dashboard-tam-tuc";
import {
  dashboardHomeFromMeetings,
  type DashboardHomeFigures,
} from "@/src/core/domain/dashboard-home-from-meetings";
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

export type OrgDashboardHome = DashboardHomeFigures & {
  recentMeetings: RecentMeetingListRow[];
};

const RECENT_LIMIT = 8;

/**
 * Le tableau de bord d'accueil, à l'échelle de l'organisation ou d'un seul
 * commercial.
 *
 * Deux requêtes, une par fenêtre. Il y en avait sept : un `count` et une
 * moyenne SQL par fenêtre, plus une liste des huit derniers RDV, tous calculés
 * sur exactement les mêmes lignes que les deux listes déjà ramenées. Compter
 * un tableau en mémoire coûte moins qu'un aller-retour en base pour le faire
 * compter ailleurs, et surtout cela ne peut plus donner deux réponses
 * différentes à la même question.
 *
 * Les huit derniers RDV sont la tête de la fenêtre courante : la base rend les
 * lignes triées par date d'ajout décroissante, cette liste-là était donc déjà
 * le début de celle-ci.
 */
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

  const sinceCurrent = meetingAtSinceForStatsWindow(input.statsWindowDays);
  const sincePrev = previousMeetingAtWindowStart(input.statsWindowDays);
  const seller =
    input.sellerUserId != null && input.sellerUserId !== ""
      ? input.sellerUserId
      : undefined;

  const [orgSettings, current, previous] = await Promise.all([
    deps.organizationSettings.findByOrganizationId(input.organizationId),
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
  ]);

  return {
    ...dashboardHomeFromMeetings({
      statsWindowDays: input.statsWindowDays,
      tamMinutesPerRdv: tamMinutesSavedPerMeetingFromSettings(orgSettings),
      prospectingMinutes: prospectingMinutesForStatsWindow(
        orgSettings?.tamObjectiveMinutesPerMonth ?? 180,
        input.statsWindowDays,
      ),
      current,
      previous,
    }),
    recentMeetings: current.slice(0, RECENT_LIMIT),
  };
}
