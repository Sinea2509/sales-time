import type { TeamScopeGroup } from "@/lib/team-seller-scope";

/**
 * La phrase qui dit ce que le mot « équipe » recouvre sur la page « Mon équipe ».
 *
 * `resolveManagerTeamUserIds` ne rend aucun cadrage au manager dont personne
 * n'est encore rattaché, et ce choix est délibéré : cadrer sur une équipe vide
 * n'afficherait aucun chiffre à celui qui vient d'ouvrir le produit. Le prix de
 * ce choix, c'est que la page s'intitule « Mon équipe » en montrant
 * l'organisation entière. Le manager d'une organisation de quarante y lit un
 * classement de quarante, une moyenne de quarante et des paliers de quarante,
 * sous un titre qui lui en promet sept, et rien à l'écran ne le détrompe.
 *
 * La phrase définit le mot au lieu de le démentir, et ce choix est mesuré et non
 * stylistique : sous cet emplacement, la première carte écrit « Moyenne
 * d'équipe » puis « équipe de 7 membres », et « Compétences de l'équipe » vient
 * plus bas. Une phrase disant « et non sur une équipe » contredirait donc à
 * l'écran la ligne qui la suit. Définir le mot une fois remet en place toutes
 * les occurrences que porte « team-collective-overview.tsx », qu'aucun cadrage
 * ne traverse.
 *
 * C'est le même défaut que la carte de position du commercial portait, et il se
 * corrige de la même façon : le mot vient du périmètre, jamais d'un réglage à
 * part. `teamScopeGroup` pose la question, ici comme là-bas.
 *
 * Le fichier est à part alors que `sousTitreDuGroupe`, son équivalent, vit dans
 * le composant qui l'affiche. La raison est mécanique et non esthétique :
 * « mon-equipe-section.tsx » importe `Link` depuis « @/i18n/navigation », donc
 * next-intl, que Jest ne sait pas charger. Une phrase laissée dans ce fichier
 * serait une phrase qu'aucun test ne peut lire.
 */
export function avertissementDeCadrage(
  comparisonGroup: TeamScopeGroup,
): string | null {
  if (comparisonGroup === "team") return null;
  return "Personne ne vous est rattaché pour l'instant : « équipe » désigne donc ici l'organisation entière. Le classement, la moyenne et les paliers comptent tous ses membres.";
}
