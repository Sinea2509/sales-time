import { libelleTranche, scoreBands, type ScoreBand } from "./score-bands";

export { libelleTranche };

/**
 * Note maximale du `coachingScore` KISS, telle que le schéma l'exige.
 *
 * Le schéma en fait un entier de 0 à 10. Cette borne est donc un fait du
 * contrat de sortie, pas un réglage : la changer ici sans changer
 * `kissGeneratedResultSchema` produirait une consigne qui décrit une échelle
 * que le modèle n'a pas le droit d'employer.
 */
export const COACHING_SCORE_MAX = 10;

/** Points de SalesScore que vaut un point de `coachingScore`. */
export const POINTS_PAR_COACHING_SCORE = 100 / COACHING_SCORE_MAX;

/** Tranche d'entiers du `coachingScore` qui tombe dans un même palier. */
export type CoachingScoreBand = ScoreBand;

/**
 * Les tranches de `coachingScore` qui correspondent aux paliers du produit.
 *
 * Le produit multiplie déjà ce score par dix pour le poser sur l'axe
 * qualification de la matrice, à côté de SalesScore qui, lui, vient d'une
 * échelle 0 à 100 : `qualificationAxisFromMeeting` prend le SalesScore quand il
 * existe et retombe sur `coachingScore / 10 * 100` sinon. Deux rendez-vous
 * voisins sur le même axe étaient donc notés sur deux règles différentes, dont
 * une seule était calibrée. Ancrer le `coachingScore` sur les paliers rend cette
 * conversion vraie au lieu de la laisser espérer.
 *
 * Les tranches ne sont pas écrites : elles se déduisent, entier par entier, de
 * la fonction qui décide déjà du palier d'un score. Un palier déplacé ou
 * renommé déplace donc la consigne envoyée au modèle, sans qu'aucune main ne
 * repasse ici. Un palier trop étroit pour contenir un entier n'apparaît pas,
 * faute d'un `coachingScore` capable de l'exprimer.
 */
export function coachingScoreBands(): readonly CoachingScoreBand[] {
  return scoreBands({
    max: COACHING_SCORE_MAX,
    pointsParUnite: POINTS_PAR_COACHING_SCORE,
  });
}

/**
 * La calibration du `coachingScore`, jointe à toute analyse KISS.
 *
 * Le schéma réclame un entier de 0 à 10 et la consigne par défaut n'en dit rien
 * de plus que « overall sales performance ». Un modèle sans repère chiffré note
 * autour de sept, quel que soit le rendez-vous, et deux modèles ne notent pas au
 * même endroit : le chiffre devient une humeur, moyennée ensuite sur des mois.
 *
 * La consigne vit ici, avec le reste du contrat non modifiable, pour la même
 * raison que la définition des six notes : un super-admin qui réécrit la
 * consigne KISS ne doit pas pouvoir faire sauter l'échelle sans le vouloir, et
 * la consigne par défaut n'est de toute façon plus lue dès qu'une version est
 * publiée en base.
 *
 * Le modèle reçoit le nom des paliers mais il ne lui est pas demandé de
 * l'écrire. Le palier affiché au commercial se calcule sur son SalesScore, une
 * autre mesure : voir « Niveau Maîtrise » dans une justification KISS pendant
 * que la fiche annonce « Progression » fabriquerait, sur un seul écran, la
 * contradiction que cette échelle existe pour supprimer. Les noms servent de
 * repère au modèle, pas de texte à recopier.
 */
export function coachingScoreScaleInstruction(): string {
  const tranches = coachingScoreBands()
    .map((band) => `- ${libelleTranche(band)}: ${band.tier.nom}`)
    .join("\n");
  return `## coachingScore (0–${COACHING_SCORE_MAX}, calibrated)
This integer is not an impression. The product multiplies it by ${POINTS_PAR_COACHING_SCORE} and reads it on the same 0–100 scale as every other score it shows, so a number given loosely here is compared with numbers that were not. Score against these bands:

${tranches}

When you hesitate between two bands, take the lower one. This score is averaged over months: half a point granted out of politeness, repeated, moves a seller up a level he has not reached, and the coaching he is then given is aimed at someone else.

No band above the first is free. Before settling on one, find in the transcript the words that justify it and quote or paraphrase 3 to 8 of them in coachingScoreJustification. If you cannot find them, the band above is not the one.`;
}
