/**
 * Comment une personne d'équipe s'appelle à l'écran.
 *
 * Une seule règle, tenue à un seul endroit : le nom complet quand la base le
 * porte, l'adresse e-mail sinon. Le tableau « Mon équipe » et la piste de
 * répartition affichent les mêmes personnes à quelques centimètres l'une de
 * l'autre ; deux règles parallèles finiraient par écrire le nom complet d'un
 * côté et l'adresse e-mail de l'autre, et le lecteur croirait voir deux
 * membres.
 */
export type TeamMemberIdentityFields = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type TeamMemberDisplayName = {
  /** Ce qui s'écrit en premier, en gras : le nom, ou l'adresse à défaut. */
  primary: string;
  /** L'adresse, quand elle ne fait pas déjà office de nom. `null` sinon. */
  secondary: string | null;
  /** Le texte dont on tire des initiales, toujours celui affiché en premier. */
  initialsSource: string;
};

export function teamMemberDisplayName(
  row: TeamMemberIdentityFields,
): TeamMemberDisplayName {
  const complet = [row.firstName, row.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (complet) {
    return { primary: complet, secondary: row.email, initialsSource: complet };
  }
  return { primary: row.email, secondary: null, initialsSource: row.email };
}
