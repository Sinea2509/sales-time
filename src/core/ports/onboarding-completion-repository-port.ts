export type OnboardingInviteRow = { email: string; role: "ADMIN" | "MEMBER" };

export type CompleteOnboardingStep4Input = {
  userId: string;
  userEmail: string;
  inviteMessage: string | null;
  inviteEmailsJson: unknown;
  invites: OnboardingInviteRow[];
};

export type CompleteOnboardingStep4Result =
  | {
      ok: true;
      organizationId: string;
      companyName: string;
      mailPayloads: { to: string; link: string }[];
    }
  | {
      ok: false;
      error:
        | "PROFILE_INCOMPLETE"
        | "WEBSITE_TAKEN"
        | "UNIQUE_CONFLICT"
        | "UNKNOWN";
    };

export interface OnboardingCompletionRepositoryPort {
  completeStep4CreateOrganizationAndInvites(
    input: CompleteOnboardingStep4Input,
  ): Promise<CompleteOnboardingStep4Result>;
}
