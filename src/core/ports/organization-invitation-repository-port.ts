import type { OrganizationMembershipRole } from "../domain/organization-membership-role";

export type OrganizationInvitationPreview = {
  email: string;
  role: OrganizationMembershipRole;
  organizationName: string;
};

export type AcceptOrganizationInvitationResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: "INVALID" | "EMAIL_MISMATCH" | "EXPIRED" };

export interface OrganizationInvitationRepositoryPort {
  findPendingByTokenForPreview(
    tokenPlaintext: string,
  ): Promise<OrganizationInvitationPreview | null>;

  acceptPendingInvitation(input: {
    tokenPlaintext: string;
    userId: string;
    userEmail: string;
  }): Promise<AcceptOrganizationInvitationResult>;
}
