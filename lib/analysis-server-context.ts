import { getApplicationDeps, type ApplicationDeps } from "@/lib/application-deps";
import { checkAiGatewayConfigured } from "@/lib/env";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

import type { WorkspaceRoleMode } from "@/src/core/domain/authorization-policy";

export type OrgActorSuccess = {
  ok: true;
  deps: ApplicationDeps;
  organizationId: string;
  actorUserId: string;
  internalUserId: string;
  email: string;
  canManageOrganization: boolean;
  workspaceRoleMode: WorkspaceRoleMode | null;
};
type OrgActorFailure = { ok: false; error: "UNAUTHENTICATED" | "NO_ORG" };
type AnalysisActorFailure =
  | OrgActorFailure
  | { ok: false; error: "AI_NOT_CONFIGURED" };

export async function requireOrgActor(): Promise<
  OrgActorSuccess | OrgActorFailure
> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false, error: "UNAUTHENTICATED" };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false, error: "NO_ORG" };
  }
  return {
    ok: true,
    deps,
    organizationId: ctx.activeOrganizationId,
    actorUserId: principal.userId,
    internalUserId: ctx.internalUserId,
    email: ctx.email,
    canManageOrganization: ctx.canManageOrganization,
    workspaceRoleMode: ctx.workspaceRoleMode,
  };
}

export async function requireAnalysisActor(): Promise<
  OrgActorSuccess | AnalysisActorFailure
> {
  const actor = await requireOrgActor();
  if (!actor.ok) return actor;

  const ai = checkAiGatewayConfigured();
  if (!ai.ok) return { ok: false, error: ai.error };

  return actor;
}
