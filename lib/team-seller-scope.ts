import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";

const DEFAULT_TRIAL_LIMIT = 5;

export { DEFAULT_TRIAL_LIMIT };

/** Returns user ids a manager may view; undefined = full org (owner). */
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

export function filterRowsByTeamUserIds<
  T extends { sellerUserId?: string; userId?: string },
>(
  rows: T[],
  teamUserIds: string[] | undefined,
  key: "sellerUserId" | "userId" = "sellerUserId",
): T[] {
  if (!teamUserIds?.length) return rows;
  const allowed = new Set(teamUserIds);
  return rows.filter((row) => {
    const id = key === "sellerUserId" ? row.sellerUserId : row.userId;
    return id != null && allowed.has(id);
  });
}
