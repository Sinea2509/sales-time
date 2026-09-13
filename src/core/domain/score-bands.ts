import { tierFromSalesScore, type RankingTier } from "./team-ranking";

/**
 * Tranche d'entiers d'une échelle qui tombe dans un même palier du produit.
 *
 * Le produit n'affiche qu'une famille de paliers, définie une fois dans
 * `RANKING_TIERS`. Plusieurs échelles y mènent pourtant : le SalesScore de 0 à
 * 100, le `coachingScore` KISS de 0 à 10, le total d'une scorecard. Écrire les
 * bornes à la main dans chacune ferait vivre autant de vérités que d'échelles,
 * et le jour où un palier bouge, seules celles qu'une main aura retrouvées
 * suivront.
 */
export type ScoreBand = {
  readonly tier: RankingTier;
  /** Premier entier de la tranche, inclus. */
  readonly min: number;
  /** Dernier entier de la tranche, inclus. */
  readonly max: number;
};

/**
 * Les tranches d'une échelle entière, déduites du palier de chaque valeur.
 *
 * `pointsParUnite` dit ce que vaut un cran de l'échelle en points de
 * SalesScore : dix pour un `coachingScore` noté sur 10, un pour un score déjà
 * exprimé sur 100. Rien n'est écrit en dur, tout se demande à la fonction qui
 * décide déjà du palier d'un score.
 *
 * Un palier trop étroit pour contenir un entier de l'échelle n'apparaît pas :
 * l'échelle est alors incapable de l'exprimer, et l'annoncer promettrait une
 * note que personne ne peut obtenir.
 */
export function scoreBands(input: {
  max: number;
  pointsParUnite: number;
}): readonly ScoreBand[] {
  const bands: ScoreBand[] = [];

  // Une borne haute infinie ferait tourner la boucle sans fin. Le cas ne vient
  // d'aucun appel d'aujourd'hui, qui passent tous une constante, mais la
  // fonction est exportée et un appel futur pourra lui passer un maximum
  // calculé : une liste vide se lit et se corrige, un écran figé non.
  if (!Number.isFinite(input.max)) return bands;

  for (let note = 0; note <= input.max; note += 1) {
    const tier = tierFromSalesScore(note * input.pointsParUnite);
    // Un palier manque quand le score n'est pas un nombre fini, ce qui suppose
    // un cran d'échelle qui n'en est pas un. Aucune note ne s'en tire alors, et
    // sortir de la boucle au lieu de passer à la suivante rendrait la même
    // liste vide : aucun test ne peut donc distinguer ce `continue` d'un
    // `break`.
    if (!tier) continue;
    const courante = bands[bands.length - 1];
    if (courante && courante.tier.id === tier.id) {
      bands[bands.length - 1] = { ...courante, max: note };
    } else {
      bands.push({ tier, min: note, max: note });
    }
  }
  return bands;
}

/**
 * « 0–3 » ou « 7 » selon que la tranche porte plusieurs entiers ou un seul.
 *
 * Le cas d'un seul entier ne se produit pas sur l'échelle de 0 à 100, ni sur
 * celle de 0 à 10 avec les paliers actuels, larges de vingt points. Il se
 * produira au premier palier plus étroit que le cran de l'échelle, et « 7–7 »
 * se lirait alors comme une faute plutôt que comme une tranche.
 */
export function libelleTranche(band: ScoreBand): string {
  return band.min === band.max ? String(band.min) : `${band.min}–${band.max}`;
}
