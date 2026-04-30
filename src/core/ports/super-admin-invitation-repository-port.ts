export type SuperAdminInvitationPreview = {
  email: string;
};

export type AcceptSuperAdminInvitationResult =
  | { ok: true }
  | { ok: false; error: "INVALID" | "EMAIL_MISMATCH" | "EXPIRED" };

export interface SuperAdminInvitationRepositoryPort {
  findPendingByTokenForPreview(
    tokenPlaintext: string,
  ): Promise<SuperAdminInvitationPreview | null>;

  acceptPendingInvitation(input: {
    tokenPlaintext: string;
    userId: string;
    userEmail: string;
  }): Promise<AcceptSuperAdminInvitationResult>;
}
