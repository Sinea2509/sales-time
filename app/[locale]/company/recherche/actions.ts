"use server";

import { requireOrgActor } from "@/lib/analysis-server-context";
import { searchOrgEntities } from "@/src/core/application/search-org-entities";

export async function searchOrgAction(query: string) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const results = await searchOrgEntities(actor.deps, {
    organizationId: actor.organizationId,
    query,
    sellerUserId: actor.internalUserId,
    canManageOrganization: actor.canManageOrganization,
  });

  return { ok: true as const, results };
}
