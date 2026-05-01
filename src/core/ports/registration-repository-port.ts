import type { UserProfileRole } from "@/src/core/domain/user-profile-role";

export type RegisterNewUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  profileRole: UserProfileRole;
  passwordHash: string;
  signupWebsiteNormalized: string;
};

export type RegisterNewUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: "EMAIL_TAKEN" | "WEBSITE_TAKEN" };

export type RegisterFromOrganizationInvitationInput = {
  tokenPlaintext: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
};

export type RegisterFromOrganizationInvitationResult =
  | { ok: true; userId: string; organizationId: string }
  | { ok: false; error: "INVALID" | "EMAIL_TAKEN" };

export interface RegistrationRepositoryPort {
  registerNewUser(input: RegisterNewUserInput): Promise<RegisterNewUserResult>;

  registerFromOrganizationInvitation(
    input: RegisterFromOrganizationInvitationInput,
  ): Promise<RegisterFromOrganizationInvitationResult>;
}
