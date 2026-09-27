import { PROFILE_SCORE_UNPROVEN_MAX } from "@/src/core/domain/profile-score-scale";
import { DEFAULT_MIN_SCORED_MEETINGS } from "@/src/core/domain/team-ranking";

export type ScoreExplanationSection = { title: string; text: string };

/**
 * « Comment c'est calculé », en quatre paragraphes, comme la maquette du 11
 * septembre les pose : le score d'un rendez-vous, le palier, les profils, et
 * ce qui se passe avec peu de rendez-vous.
 *
 * Le texte décrit ce que le produit calcule aujourd'hui : le SalesScore d'un
 * rendez-vous est la moyenne des six leviers SONCAS, et la scorecard de la
 * grille note à part le travail du commercial. Il est écrit ici, une seule
 * fois, pour que le tableau de bord et la fiche ne racontent pas deux calculs.
 */
export function salesScoreExplanation(
  audience: "commercial" | "manager",
): ScoreExplanationSection[] {
  return [
    {
      title: "Le SalesScore d'un rendez-vous, sur 100.",
      text: "C'est la moyenne des six leviers SONCAS entendus chez le prospect, chacun noté de 0 à 100 d'après ce qui s'entend dans le transcript, et jamais au-dessus de la première tranche sans une citation pour le prouver. La grille de découverte, elle, note à part le travail du commercial : 25 critères en 5 blocs, chacun de 0 à 4, dont la somme pondérée fait le score de la scorecard.",
    },
    audience === "manager"
      ? {
          title: "Le palier, et la note globale sur 5.",
          text: "Le palier vient de la moyenne des SalesScore de la période : Démarrage en dessous de 40, Progression de 40 à 60, Maîtrise de 60 à 80, Excellence à partir de 80. La note sur 5 est cette même moyenne ramenée sur 5, réservée à la vue manager pour le classement.",
        }
      : {
          title: "Votre palier.",
          text: "Il vient de la moyenne de vos SalesScore de la période : Démarrage en dessous de 40, Progression de 40 à 60, Maîtrise de 60 à 80, Excellence à partir de 80. Un palier n'est pas un jugement, c'est une photo à un moment donné : il bouge dès que vos prochains rendez-vous sont analysés.",
        },
    {
      title: "Les profils SONCAS et DISC, sur 100.",
      text: `Chaque levier et chaque style est noté sur 100 d'après ce qui s'entend dans le transcript. Au-dessus de ${PROFILE_SCORE_UNPROVEN_MAX}, le produit exige une citation du prospect ; sans citation, la note est ramenée à ${PROFILE_SCORE_UNPROVEN_MAX} au plus. Un score élevé est donc toujours prouvé.`,
    },
    {
      title: `Moins de ${DEFAULT_MIN_SCORED_MEETINGS} rendez-vous analysés ?`,
      text: "Le classement est marqué « peu de données » : une moyenne sur deux rendez-vous n'est pas une tendance.",
    },
  ];
}
