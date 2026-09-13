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

/**
 * Combien de périodes la trajectoire couvre.
 *
 * Le nombre vit ici et non dans les pages qui dessinent la courbe : deux
 * chemins de données y mènent, celui de « Performance » et celui de la fiche
 * d'un commercial, et deux courbes de profondeurs différentes présentées comme
 * la même trajectoire mentiraient sur ce qu'elles comparent.
 */
export const SALES_PROFILE_HISTORY_PERIODS = 6;

/**
 * L'écart minimal, en points, que la bande verticale de la courbe couvre.
 *
 * Une courbe tracée sur toute l'échelle de 0 à 100 est une ligne plate : les
 * notes de profil d'un même commercial tiennent en quelques points d'écart, si
 * bien qu'une progression réelle de 68 à 74 occupait deux pixels et se lisait
 * « stagne ». La bande se resserre donc autour des relevés.
 *
 * Elle ne se resserre pas jusqu'à eux pour autant : sous cet écart plancher, un
 * frémissement de deux points remplirait la hauteur et se lirait « décolle ».
 * Vingt points laissent un pas de cinq points occuper un quart de la hauteur,
 * visible sans être spectaculaire.
 */
export const SALES_PROFILE_TRAJECTORY_MIN_SPAN = 20;

/** Les bornes verticales entre lesquelles la courbe se dessine. */
export type SalesProfileTrajectoryBand = {
  low: number;
  high: number;
};

/**
 * La bande verticale à donner à la courbe pour que ses variations se voient.
 *
 * Le résultat contient toujours toutes les valeurs reçues, couvre au moins
 * `minSpan` points et reste dans l'échelle de 0 à 100. Les bornes sont entières
 * pour être affichables telles quelles : une échelle resserrée n'est honnête
 * qu'annoncée, et la courbe écrit ces deux nombres sur son flanc.
 */
export function salesProfileTrajectoryBand(
  values: readonly number[],
  minSpan: number = SALES_PROFILE_TRAJECTORY_MIN_SPAN,
): SalesProfileTrajectoryBand {
  if (values.length === 0) return { low: 0, high: 100 };
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  // Jamais plus large que l'échelle elle-même : sans ce plafond, un écart
  // plancher démesuré rendrait des bornes en dehors de 0 et 100.
  const span = Math.min(Math.max(highest - lowest, minSpan), 100);
  // Centrée sur les relevés, puis glissée, non rognée, quand elle dépasse une
  // borne de l'échelle : rogner lui ferait perdre son écart et rendrait la
  // pente d'un très bon commercial plus raide que celle d'un autre.
  let low = (lowest + highest) / 2 - span / 2;
  if (low < 0) low = 0;
  if (low + span > 100) low = 100 - span;
  return { low: Math.floor(low), high: Math.ceil(low + span) };
}

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
