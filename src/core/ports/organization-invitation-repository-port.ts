import type { OrganizationMembershipRole } from "../domain/organization-membership-role";

export type OrganizationInvitationPreview = {
  email: string;
  role: OrganizationMembershipRole;
  organizationName: string;
  /** « Prénom Nom » de la personne qui a invité, quand il est connu. */
  inviterName?: string | null;
  expiresAt?: Date;
  /**
   * Vrai quand un compte existe déjà pour l'adresse invitée : la page
   * propose alors de se connecter, sinon elle montre le formulaire
   * d'inscription. Seul le porteur du lien, donc l'invité, le voit.
   */
  accountExists?: boolean;
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

  /**
   * L'invitation en attente la plus récente pour une adresse, toutes
   * organisations confondues ; null s'il n'y en a pas.
   */
  findLatestPendingForEmail(email: string): Promise<{
    id: string;
    organizationName: string;
    inviterName: string | null;
    expiresAt: Date;
  } | null>;

  /** Remplace le lien d'une invitation en attente ; l'ancien ne vaut plus. */
  replaceTokenHash(input: { id: string; tokenHash: string }): Promise<void>;
}
