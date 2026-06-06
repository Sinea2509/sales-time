"use server";

import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { searchOrgEntities } from "@/src/core/application/search-org-entities";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";

export async function searchOrgAction(query: string) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const };
  }

  const results = await searchOrgEntities(deps, {
    organizationId: ctx.activeOrganizationId,
    query,
    sellerUserId: ctx.internalUserId ?? undefined,
    canManageOrganization: ctx.canManageOrganization,
  });

  return { ok: true as const, results };
}
