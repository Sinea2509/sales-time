import { redirect } from "next/navigation";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import type { ActorContext } from "@/src/core/domain/actor-context";

export async function requireDashboardActor(): Promise<ActorContext> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) redirect("/sign-in");

  const superAdminOrg = await readSuperAdminOrgCookie();
  return getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
}
