import type { OrganizationMembershipRole } from "./organization-membership-role";

/** Super-admin impersonation context for a tenant organization. */
export type SuperAdminOrgElevation = {
  organizationId: string;
  role: OrganizationMembershipRole;
};
