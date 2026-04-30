"use server";

import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";

/** Example guarded server action: only org admins (or elevated super admins) may run. */
export async function exampleOrgAdminOnlyAction() {
  const deps = getApplicationDeps();
  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrg,
    },
  );
  if (ctx.kind !== "authenticated" || !ctx.canManageOrganization) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return { ok: true as const };
}
