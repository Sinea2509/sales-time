import {
  formatEcartCompetence,
  SELLER_SKILL_LABEL_FR,
  type SellerSkillSignature,
} from "@/src/core/domain/seller-skill-signature";

/**
 * Les deux phrases de focus d'un commercial, écrites une seule fois.
 *
 * Le manager les lit sur sa carte « à coacher en priorité », le commercial les
 * lit sur son propre tableau de bord : c'est le même signal, sur la même
 * personne, et les deux écrans doivent en dire exactement la même chose. En les
 * tenant ici, « Point fort · Écoute active +17 » ne peut pas s'écrire d'une
 * façon chez le manager et d'une autre chez le commercial. `essentielDuManager`
 * et l'accueil du commercial appellent tous deux ces fonctions.
 *
 * Elles prennent une signature déjà présente : c'est l'appelant qui décide quoi
 * afficher quand elle manque, faute de rendez-vous coaché ou de collègue à qui
 * se comparer. L'écart porte le vrai signe moins, U+2212, via
 * `formatEcartCompetence`.
 */

/** « Point fort · Écoute active +17 ». */
export function libellePointFort(signature: SellerSkillSignature): string {
  return `Point fort · ${SELLER_SKILL_LABEL_FR[signature.fort]} ${formatEcartCompetence(
    signature.ecartFort,
  )}`;
}

/** « Axe d'amélioration · Assertivité −12 ». */
export function libelleATravailler(signature: SellerSkillSignature): string {
  return `Axe d'amélioration · ${SELLER_SKILL_LABEL_FR[signature.faible]} ${formatEcartCompetence(
    signature.ecartFaible,
  )}`;
}
