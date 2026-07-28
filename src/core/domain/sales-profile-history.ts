import {
  SALES_PROFILE_DIMENSION_KEYS,
  aggregateTeamSalesProfileFromMeetings,
} from "./sales-profile-from-meetings";
import type { StatsWindowDays } from "./dashboard-stats-window";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

/**
 * La trajectoire du profil de vente sur plusieurs périodes.
 *
 * La croissance ne disait que le dernier pas, actuel contre précédent. Cette
 * fonction redonne le chemin : elle découpe les rendez-vous en `periodCount`
 * fenêtres consécutives de même durée, de la plus ancienne à la plus récente,
 * et rend la moyenne du profil de chacune. Un graphique en fait une ligne, si
 * bien qu'on lit d'un coup si le commercial monte, stagne ou redescend.
 *
 * Une période sans rendez-vous noté rend `average: null`, et non zéro : une
 * absence de données n'est pas une note nulle. La ligne saute alors ce point
 * plutôt que de plonger au sol.
 */
export type SalesProfilePeriodPoint = {
  /** Fin de la fenêtre, la période va de `end - days` à `end`. */
  end: Date;
  average: number | null;
  rdvCount: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Début de la fenêtre qui couvre les `count` dernières périodes de `days` jours. */
export function meetingAtSinceForWindows(
  days: StatsWindowDays,
  count: number,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - count * days * MS_PER_DAY);
}

function averageOfScores(scores: Record<string, number>): number {
  const total = SALES_PROFILE_DIMENSION_KEYS.reduce(
    (acc, key) => acc + scores[key],
    0,
  );
  return Math.round(total / SALES_PROFILE_DIMENSION_KEYS.length);
}

export function salesProfileHistory(
  meetings: RecentMeetingListRow[],
  days: StatsWindowDays,
  periodCount: number,
  now: Date = new Date(),
): SalesProfilePeriodPoint[] {
  const points: SalesProfilePeriodPoint[] = [];
  for (let i = 0; i < periodCount; i += 1) {
    // i = 0 est la période la plus ancienne, i = periodCount - 1 la plus
    // récente, dont la fin est `now`. Chaque fenêtre couvre `[end - days, end)`.
    const stepsFromNow = periodCount - 1 - i;
    const end = new Date(now.getTime() - stepsFromNow * days * MS_PER_DAY);
    const start = new Date(end.getTime() - days * MS_PER_DAY);
    const bucket = meetings.filter(
      (m) => m.meetingAt >= start && m.meetingAt < end,
    );
    const aggregate = aggregateTeamSalesProfileFromMeetings(bucket);
    points.push({
      end,
      average: aggregate.scores ? averageOfScores(aggregate.scores) : null,
      rdvCount: aggregate.rdvCount,
    });
  }
  return points;
}

/** Nombre de périodes dont on peut tirer une note : utile pour décider d'afficher la courbe. */
export function salesProfileHistoryFilledCount(
  points: SalesProfilePeriodPoint[],
): number {
  return points.filter((point) => point.average !== null).length;
}
