import { memberNameLine } from "@/src/core/domain/member-name-line";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";

const DEFAULT_TRIAL_LIMIT = 5;

export { DEFAULT_TRIAL_LIMIT };

/**
 * Périmètre de lecture d'un manager : lui-même et les commerciaux qui lui sont
 * rattachés.
 *
 * Il fait partie de l'équipe qu'il administre, exactement comme dans
 * `resolveSellerTeamUserIds` : sans lui, les deux écrans ne calculeraient déjà
 * plus la même moyenne.
 *
 * `undefined` veut dire « pas de cadrage », donc « tout », jamais « rien ».
 * Ce sont les deux appelants qui lui donnent ce sens, `getOrgAdminDashboard` et
 * `getTeamMemberStanding`, chacun avec la même ligne : une liste absente ou
 * vide, et toutes les lignes passent.
 *
 * Trois `return undefined` suivent, mais un seul se produit en vrai : l'équipe
 * vide. Les deux premiers protègent une signature plus large que les appels,
 * car les trois pages concernées n'entrent qu'après
 * `workspaceRoleMode === "admin"`, qui exige `canManageOrganization`, et un
 * acteur authentifié porte toujours un `internalUserId`.
 *
 * L'équipe vide mérite d'être dite : sur une organisation où personne n'a
 * encore déclaré son manager, cadrer sur une équipe vide n'afficherait aucun
 * chiffre à celui qui vient d'ouvrir le produit.
 */
export async function resolveManagerTeamUserIds(
  deps: { users: UserRepositoryPort },
  input: {
    canManageOrganization: boolean;
    internalUserId: string | null;
  },
): Promise<string[] | undefined> {
  if (!input.canManageOrganization || !input.internalUserId) {
    return undefined;
  }
  const reports = await deps.users.listDirectReportUserIds(
    input.internalUserId,
  );
  if (reports.length === 0) {
    return undefined;
  }
  return [...new Set([input.internalUserId, ...reports])];
}

/**
 * Périmètre de classement d'un commercial : l'équipe de son manager.
 *
 * Un commercial n'encadre personne, mais il appartient à une équipe, et c'est
 * sur elle que son manager le classe. Si son tableau de bord le classait sur
 * l'organisation entière, les deux écrans annonceraient deux places différentes
 * pour la même personne, et celui qui a tort serait toujours l'autre.
 *
 * Renvoie `undefined` quand aucun manager n'est renseigné : le classement porte
 * alors sur l'organisation, faute d'équipe déclarée. C'est la même convention
 * que `resolveManagerTeamUserIds`, et le même sens : « pas de cadrage ».
 */
export async function resolveSellerTeamUserIds(
  deps: { users: UserRepositoryPort },
  input: { internalUserId: string | null },
): Promise<string[] | undefined> {
  if (!input.internalUserId) return undefined;
  const managerId = await deps.users.findManagerUserId(input.internalUserId);
  if (!managerId) return undefined;
  const reports = await deps.users.listDirectReportUserIds(managerId);
  // Le manager fait partie de l'équipe qu'il cadre, exactement comme dans
  // `resolveManagerTeamUserIds` : sans lui, les deux écrans ne calculeraient
  // déjà plus la même moyenne.
  return [...new Set([managerId, ...reports, input.internalUserId])];
}

/**
 * Le nom du manager d'un commercial, ou `null` s'il n'en a pas.
 *
 * Sa place se mesure sur l'équipe de son manager, pas sur l'organisation. Tant
 * que cet écran ne disait pas de quelle équipe il parlait, « 3e sur 7 » restait
 * un chiffre sans référent : sept qui ? Le nom du manager désigne le groupe, et
 * son absence dit l'autre cas, celui où la place se mesure faute de mieux sur
 * toute l'organisation.
 *
 * La recherche passe par l'adhésion à l'organisation plutôt que par le compte :
 * le rattachement est une propriété de la personne, qu'aucune organisation ne
 * borne. Un manager qui a quitté celle-ci ne doit pas y laisser son nom, et
 * `null` renvoie alors l'écran au cas sans équipe, qui est déjà écrit.
 */
export async function resolveSellerManagerNameLine(
  deps: {
    users: UserRepositoryPort;
    organizationTeam: OrganizationTeamRepositoryPort;
  },
  input: { organizationId: string; internalUserId: string | null },
): Promise<string | null> {
  if (!input.internalUserId) return null;
  const managerId = await deps.users.findManagerUserId(input.internalUserId);
  if (!managerId) return null;
  const membership = await deps.organizationTeam.findMembershipForManagerView(
    input.organizationId,
    managerId,
  );
  if (!membership) return null;
  return memberNameLine(membership.user);
}

/**
 * Le groupe sur lequel un rang cadré par ce périmètre se mesure.
 *
 * Les écrans qui affichent une place écrivent « la moyenne d'équipe » et
 * « parmi les 7 de l'équipe ». C'est vrai tant qu'un périmètre existe. Quand il
 * n'y en a pas, les mêmes phrases désignent l'organisation entière sans le
 * dire, et le lecteur compte une équipe de quarante.
 *
 * Le test est celui de `scopeRows`, mot pour mot : une liste absente ou vide
 * laisse passer toutes les lignes, donc le rang porte sur l'organisation. Les
 * deux ne peuvent pas diverger, puisque c'est la même question posée au même
 * tableau.
 */
export type TeamScopeGroup = "team" | "organization";

export function teamScopeGroup(
  teamUserIds: string[] | undefined | null,
): TeamScopeGroup {
  return teamUserIds?.length ? "team" : "organization";
}

/**
 * La règle d'application d'un périmètre d'équipe, écrite une fois.
 *
 * Les deux résolutions ci-dessus rendent `undefined` quand aucune équipe n'est
 * déclarée, et cet `undefined` veut dire « tout », jamais « rien ». La règle
 * vivait jusqu'ici recopiée sur chaque écran, une ligne à chaque fois ;
 * recopiée, elle pouvait être oubliée, et elle l'a été sur `/company/analyse`,
 * qui annonçait « l'équipe » en comptant l'organisation entière.
 *
 * Le tableau reçu est rendu tel quel quand il n'y a pas de périmètre : le cas
 * le plus fréquent ne paie pas de copie.
 */
function scopeRows<T>(
  rows: T[],
  teamUserIds: string[] | undefined | null,
  userIdOf: (row: T) => string,
): T[] {
  if (!teamUserIds?.length) return rows;
  const ids = new Set(teamUserIds);
  return rows.filter((row) => ids.has(userIdOf(row)));
}

/** Les rendez-vous de l'équipe, désignée par le commercial qui les a menés. */
export function scopeMeetingsToTeam<T extends { sellerUserId: string }>(
  meetings: T[],
  teamUserIds: string[] | undefined | null,
): T[] {
  return scopeRows(meetings, teamUserIds, (m) => m.sellerUserId);
}

/** Les membres de l'équipe, parmi ceux de l'organisation. */
export function scopeMembersToTeam<T extends { userId: string }>(
  members: T[],
  teamUserIds: string[] | undefined | null,
): T[] {
  return scopeRows(members, teamUserIds, (m) => m.userId);
}

/**
 * Cette personne est-elle en dehors du périmètre d'équipe reçu ?
 *
 * Faux quand il n'y a pas de périmètre : une liste absente ou vide veut dire
 * « tout le monde », donc personne n'en est dehors. C'est la convention des
 * fonctions ci-dessus, et il faut que ce soit exactement la même : la fiche
 * d'un commercial s'en sert pour expliquer une absence de classement que
 * `scopeMembersToTeam` vient de produire.
 */
export function isOutsideScopedTeam(
  teamUserIds: string[] | undefined | null,
  userId: string,
): boolean {
  if (!teamUserIds?.length) return false;
  return !teamUserIds.includes(userId);
}
