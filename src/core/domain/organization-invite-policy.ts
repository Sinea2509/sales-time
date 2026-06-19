import type { OrganizationMembershipRole } from "./organization-membership-role";

/** Returns the invite role to persist, or null when the actor may not assign it. */
export function resolveOrganizationInviteRole(input: {
  actorRole: OrganizationMembershipRole;
  requestedRole: OrganizationMembershipRole;
}): OrganizationMembershipRole | null {
  if (input.actorRole === "ADMIN") {
    return input.requestedRole;
  }
  return input.requestedRole === "MEMBER" ? "MEMBER" : null;
}
