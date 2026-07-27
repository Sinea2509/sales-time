import {
  meetingAtSinceForStatsWindow,
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type StatsWindowRdvsCounts = Record<StatsWindowDays, number>;

/**
 * Combien de rendez-vous chaque période propose, pour un écran donné.
 *
 * Ces comptes pilotent le sélecteur de période : ils décident des périodes
 * grisées, et `ensureEligibleStatsWindowDays` va jusqu'à rediriger vers une
 * autre période. Ils doivent donc nommer exactement la population que l'écran
 * affiche, sans quoi le sélecteur propose, voire impose, une période que la
 * page rend vide.
 *
 * D'où une liste de commerciaux et non un seul identifiant : un écran d'équipe
 * compte son équipe. Absente ou vide, elle veut dire « pas de cadrage », donc
 * l'organisation entière, jamais personne : c'est la convention de
 * `lib/team-seller-scope.ts`, tenue d'un bout à l'autre de la chaîne.
 */
export async function getStatsWindowRdvsCounts(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string;
    sellerUserIds?: string[] | null;
  },
): Promise<StatsWindowRdvsCounts> {
  const scope = input.sellerUserIds?.length ? input.sellerUserIds : undefined;

  const entries = await Promise.all(
    STATS_WINDOW_DAYS_OPTIONS.map(async (days) => {
      const count = await deps.meetings.countMeetingsWithMeetingAtSince({
        organizationId: input.organizationId,
        since: meetingAtSinceForStatsWindow(days),
        sellerUserIds: scope,
      });
      return [days, count] as const;
    }),
  );

  return Object.fromEntries(entries) as StatsWindowRdvsCounts;
}
