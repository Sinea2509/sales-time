import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { resolveEffectiveOrganizationSettingsAccess } from "@/src/core/domain/organization-settings-access";
import type { ActorContext } from "@/src/core/domain/actor-context";

export type OrgSettingsAccess = {
  actor: Extract<ActorContext, { kind: "authenticated" }>;
  canManageOrganizationSettings: boolean;
  organizationHasManager: boolean;
};

export async function loadOrgSettingsAccess(): Promise<OrgSettingsAccess | null> {
  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: await readSuperAdminOrgCookie() },
  );

  if (
    actor.kind !== "authenticated" ||
    !actor.activeOrganizationId ||
    !actor.canAccessOrganizationSettings
  ) {
    return null;
  }

  const managerCount = await deps.organizationTeam.countAdminsInOrganization(
    actor.activeOrganizationId,
  );
  const { canManageOrganizationSettings, organizationHasManager } =
    resolveEffectiveOrganizationSettingsAccess({
      canManageOrganization: actor.canManageOrganization,
      organizationMembershipRole: actor.organizationMembershipRole,
      managerCount,
    });

  return {
    actor,
    canManageOrganizationSettings,
    organizationHasManager,
  };
}
