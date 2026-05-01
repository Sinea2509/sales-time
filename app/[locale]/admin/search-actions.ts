"use server";

import { getApplicationDeps } from "@/lib/application-deps";
import { requireSuperAdminActor } from "@/src/core/application/require-super-admin";

type SearchResult = {
  users: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }[];
  organizations: { id: string; name: string; slug: string | null }[];
};

export async function searchAdminAction(query: string): Promise<SearchResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return { users: [], organizations: [] };

  const q = query.trim();
  if (!q) return { users: [], organizations: [] };

  return deps.adminSearch.searchUsersAndOrganizations(q);
}
