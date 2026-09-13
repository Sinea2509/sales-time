/**
 * Le plan d'action de la semaine du commercial, tiré de son coaching KISS.
 *
 * Le coaching détaillé du commercial vit sur sa fiche : quatre colonnes, une
 * dizaine de gestes. Sur son tableau de bord, il n'a pas besoin de tout relire,
 * il a besoin de savoir sur quoi se concentrer cette semaine. Cette fonction
 * choisit ces gestes-là, et rien d'autre.
 *
 * Deux quadrants seulement, et dans cet ordre. « Start » d'abord : les rituels
 * à installer sont les gains de la semaine les plus nets, un geste neuf qu'on
 * prend ou qu'on ne prend pas. « Improve » ensuite : affiner un geste déjà là
 * demande de le refaire mieux, ce qui se joue sur plusieurs rendez-vous. « Keep »
 * n'a rien à faire dans un plan d'action, c'est déjà acquis ; « Stop » dit
 * d'arrêter, pas de commencer, et mêler « faites » et « ne faites plus » dans
 * une même liste brouille l'un et l'autre. Les deux restent lisibles sur la
 * fiche, en entier.
 *
 * Fonction pure, sans dépendance à la couche application : elle prend les deux
 * listes de puces déjà produites, jamais l'objet complet, pour rester du
 * domaine et se relire sans base de données.
 */

export type CoachingActionKind = "start" | "improve";

export type CoachingAction = {
  readonly kind: CoachingActionKind;
  readonly text: string;
};

/** Combien de gestes le plan retient au plus. Trois tiennent dans une semaine. */
export const SELLER_ACTION_PLAN_MAX = 3;

export function sellerActionPlan(
  input: {
    readonly startBullets: readonly string[];
    readonly improveBullets: readonly string[];
  },
  max: number = SELLER_ACTION_PLAN_MAX,
): CoachingAction[] {
  const actions: CoachingAction[] = [
    ...input.startBullets.map((text) => ({ kind: "start" as const, text })),
    ...input.improveBullets.map((text) => ({ kind: "improve" as const, text })),
  ];
  return actions.slice(0, Math.max(0, max));
}
