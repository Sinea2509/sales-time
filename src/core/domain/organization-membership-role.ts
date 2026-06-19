/** Member role within an organization tenant; values match persisted storage. */
export type OrganizationMembershipRole = "ADMIN" | "MEMBER";

export const ORGANIZATION_MEMBERSHIP_ROLES = [
  "ADMIN",
  "MEMBER",
] as const satisfies readonly OrganizationMembershipRole[];

/** French UI label for an organization membership role. */
export function organizationMembershipRoleLabel(
  role: OrganizationMembershipRole,
): string {
  switch (role) {
    case "ADMIN":
      return "Manager";
    case "MEMBER":
      return "Commercial";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
