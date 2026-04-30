import type { OrganizationMembershipRole } from "./organization-membership-role";
import type { SystemRoleType } from "./system-role-type";

export type SessionMembership = {
  organizationId: string;
  role: OrganizationMembershipRole;
};

export type SessionPrincipal = {
  sessionId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  registerProfileCompletedAt: Date | null;
  systemRoles: SystemRoleType[];
  memberships: SessionMembership[];
};
