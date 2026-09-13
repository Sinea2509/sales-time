import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileDimensionKey,
  type SalesProfileScores,
} from "./sales-profile-from-meetings";

/**
 * L'évolution du profil de vente d'une période à la précédente, compétence par
 * compétence puis en global.
 *
 * Le radar montrait déjà deux formes superposées, « actuel » et « précédent »,
 * mais aucun chiffre : l'œil voyait que l'aire avait bougé sans pouvoir dire de
 * combien. Ces fonctions rendent le mouvement en clair, sous forme de variation
 * relative en pourcentage, celle-là même que les cartes de KPI affichent déjà
 * (« vs 30 j. préc. »).
 *
 * `deltaPct` est une variation relative, `(actuel - précédent) / précédent`, et
 * non un écart de points : c'est ce que « croissance » et « décroissance »
 * désignent d'ordinaire. Elle vaut `null`, et non zéro, quand elle n'a pas de
 * sens : sans période précédente (`previous` absent) il n'y a rien à comparer,
 * et un précédent nul mettrait une division par zéro là où la « croissance » est
 * de toute façon indéfinie. `null` se lit « pas de comparaison », un badge
 * absent plutôt qu'un « +0 % » trompeur.
 */
export type SalesProfileDimensionEvolution = {
  key: SalesProfileDimensionKey;
  current: number;
  previous: number | null;
  deltaPct: number | null;
};

function relativePct(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function average(scores: SalesProfileScores): number {
  const total = SALES_PROFILE_DIMENSION_KEYS.reduce(
    (acc, key) => acc + scores[key],
    0,
  );
  return Math.round(total / SALES_PROFILE_DIMENSION_KEYS.length);
}

export function salesProfileEvolution(
  current: SalesProfileScores,
  previous: SalesProfileScores | null,
): SalesProfileDimensionEvolution[] {
  return SALES_PROFILE_DIMENSION_KEYS.map((key) => {
    const previousValue = previous ? previous[key] : null;
    return {
      key,
      current: current[key],
      previous: previousValue,
      deltaPct: relativePct(current[key], previousValue),
    };
  });
}

export type SalesProfileOverallEvolution = {
  currentAverage: number;
  previousAverage: number | null;
  deltaPct: number | null;
};

/**
 * Le profil pris comme un tout : la moyenne des six compétences, et sa variation
 * relative d'une période à l'autre. La moyenne est arrondie comme les notes
 * affichées, si bien que le pourcentage se lit sur les mêmes nombres que ceux
 * portés à l'écran.
 */
export function salesProfileOverallEvolution(
  current: SalesProfileScores,
  previous: SalesProfileScores | null,
): SalesProfileOverallEvolution {
  const currentAverage = average(current);
  if (!previous) {
    return { currentAverage, previousAverage: null, deltaPct: null };
  }
  const previousAverage = average(previous);
  return {
    currentAverage,
    previousAverage,
    deltaPct: relativePct(currentAverage, previousAverage),
  };
}
