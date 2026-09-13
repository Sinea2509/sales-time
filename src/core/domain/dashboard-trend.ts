/**
 * Variation % période courante vs période précédente (même durée).
 *
 * Renvoie `null` quand la période précédente vaut zéro, quelle que soit la
 * valeur courante. Partant de rien, aucune variation relative n'existe : le
 * dénominateur est nul, et « +100 % » se lirait comme un doublement alors que
 * l'activité vient simplement de commencer. Un premier rendez-vous après une
 * période vide n'est pas une progression de 100 %, c'est un premier
 * rendez-vous. L'écran n'affiche alors aucun badge, ce qui est la seule chose
 * vraie à dire.
 *
 * La chute vers zéro, elle, reste mesurable : passer de 40 à 0 fait bien
 * −100 %, et le dénominateur existe.
 */
export function percentChangeVsPrevious(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round((100 * (current - previous)) / previous);
}
