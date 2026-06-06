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

export function filterRowsByTeamUserIds<T extends { sellerUserId?: string; userId?: string }>(
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
