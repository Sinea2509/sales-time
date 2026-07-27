import { kissCoachingBulletsFromMeetings } from "@/src/core/domain/kiss-coaching-bullets-from-meetings";
import {
  meetingAtSinceForStatsWindow,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  sellerActionPlan,
  type CoachingAction,
} from "@/src/core/domain/seller-action-plan";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

/**
 * Le plan d'action de la semaine d'un commercial, prêt pour son tableau de bord.
 *
 * Ce sont ses propres rendez-vous, pas ceux de l'équipe : la requête est cadrée
 * sur lui, avec le résultat KISS de chacun, sur la période choisie. Les gestes
 * en sortent par `sellerActionPlan`, qui décide lesquels et dans quel ordre.
 *
 * Aucune IA n'est appelée ici : les puces KISS sont déjà écrites et rangées à
 * l'analyse de chaque rendez-vous ; cette fonction ne fait que les rassembler.
 * Sans organisation, le plan est vide, comme partout ailleurs.
 */
export async function getSellerCoachingActionPlan(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string | null;
    statsWindowDays: StatsWindowDays;
    sellerUserId: string;
  },
): Promise<CoachingAction[]> {
  if (!input.organizationId) return [];

  const meetings = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: input.organizationId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: meetingAtSinceForStatsWindow(input.statsWindowDays),
    sellerUserId: input.sellerUserId,
    includeLatestKissResult: true,
  });

  return sellerActionPlan({
    startBullets: kissCoachingBulletsFromMeetings(meetings, "start", 5),
    improveBullets: kissCoachingBulletsFromMeetings(meetings, "improve", 5),
  });
}
