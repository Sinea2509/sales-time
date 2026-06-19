import type { OrganizationMembershipRole } from "../domain/organization-membership-role";

export type OrgTeamMemberRow = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: OrganizationMembershipRole;
  joinedAt: string;
};

export type OrgTeamInvitationRow = {
  id: string;
  email: string;
  role: OrganizationMembershipRole;
  expiresAt: string;
  createdAt: string;
};

export interface OrganizationTeamRepositoryPort {
  listMembersAndPendingInvitations(organizationId: string): Promise<{
    members: OrgTeamMemberRow[];
    invitations: OrgTeamInvitationRow[];
  }>;

  findUserIdByEmail(email: string): Promise<string | null>;

  findMembership(
    userId: string,
    organizationId: string,
  ): Promise<{ id: string } | null>;

  findPendingInvitationForEmail(
    organizationId: string,
    email: string,
  ): Promise<{ id: string } | null>;

  getOrganizationName(organizationId: string): Promise<string | null>;

  createPendingInvitation(input: {
    organizationId: string;
    email: string;
    role: OrganizationMembershipRole;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void>;

  countAdminsInOrganization(organizationId: string): Promise<number>;

  findMembershipWithUserEmail(
    membershipId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    role: OrganizationMembershipRole;
    userId: string;
    userEmail: string;
  } | null>;

  updateMembershipRole(
    membershipId: string,
    role: OrganizationMembershipRole,
  ): Promise<void>;

  findMembershipByIdForOrg(
    membershipId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    userId: string;
    role: OrganizationMembershipRole;
  } | null>;

  deleteMembership(membershipId: string): Promise<void>;

  findPendingInvitationByIdForOrg(
    invitationId: string,
    organizationId: string,
  ): Promise<{ id: string } | null>;

  revokeInvitation(invitationId: string): Promise<void>;

  findMembershipForManagerView(
    organizationId: string,
    userId: string,
  ): Promise<{
    role: OrganizationMembershipRole;
    user: { email: string; firstName: string | null; lastName: string | null };
  } | null>;

  findMembershipFollowUpEmailPreferences(
    userId: string,
    organizationId: string,
  ): Promise<{
    emailTone: string | null;
    emailVouvoiement: boolean | null;
    emailSignature: string | null;
  } | null>;

  upsertMembershipFollowUpEmailPreferences(
    userId: string,
    organizationId: string,
    data: {
      emailTone: string | null;
      emailVouvoiement: boolean;
      emailSignature: string | null;
    },
  ): Promise<void>;
}
