import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import type { ActorContext } from "@/src/core/domain/actor-context";

export async function requireDashboardActor(): Promise<ActorContext> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await ensureClerkUserSynced(userId);
  const superAdminOrg = await readSuperAdminOrgCookie();
  return getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });
}
