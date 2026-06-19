import { cache } from "react";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { resolveEffectiveOrganizationSettingsAccess } from "@/src/core/domain/organization-settings-access";
import type { ActorContext } from "@/src/core/domain/actor-context";
import type { OrganizationMembershipRole } from "@/src/core/domain/organization-membership-role";

export type OrgSettingsAccess = {
  actor: Extract<ActorContext, { kind: "authenticated" }>;
  canManageOrganizationSettings: boolean;
  organizationHasManager: boolean;
};

export type OrgSettingsActor = {
  organizationId: string;
  userId: string;
  email: string;
  role: OrganizationMembershipRole;
  canManageOrganizationSettings: boolean;
  organizationHasManager: boolean;
};

export const loadOrgSettingsAccess = cache(async function loadOrgSettingsAccess(): Promise<OrgSettingsAccess | null> {
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
});

export async function loadOrgSettingsActor(): Promise<OrgSettingsActor | null> {
  const access = await loadOrgSettingsAccess();
  if (!access || !access.actor.organizationMembershipRole) {
    return null;
  }

  return {
    organizationId: access.actor.activeOrganizationId!,
    userId: access.actor.internalUserId,
    email: access.actor.email,
    role: access.actor.organizationMembershipRole,
    canManageOrganizationSettings: access.canManageOrganizationSettings,
    organizationHasManager: access.organizationHasManager,
  };
}
