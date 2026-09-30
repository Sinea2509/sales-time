import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileDimensionKey,
  type SalesProfileScores,
} from "./sales-profile-from-meetings";
import { SELLER_SKILL_SHORT_FR } from "./seller-skill-signature";

export type SellerTopSkill = {
  key: SalesProfileDimensionKey;
  label: string;
  score: number;
};

/**
 * Les points forts du mois d'un commercial : ses compétences les mieux
 * notées, dans l'ordre, avec le nom court qu'une pastille peut porter.
 *
 * Deux par défaut : une seule ne dessine pas un profil, trois se lisent
 * comme une liste. La note voyage avec, pour que la pastille dise « Écoute,
 * 78 sur 100 » et non seulement « Écoute », qui ne dirait pas si c'est fort.
 */
export function sellerTopSkills(
  scores: SalesProfileScores | null,
  count = 2,
): SellerTopSkill[] {
  if (!scores) return [];
  return SALES_PROFILE_DIMENSION_KEYS.map((key) => ({
    key,
    label: SELLER_SKILL_SHORT_FR[key],
    score: Math.round(scores[key]),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
