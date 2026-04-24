import type { SystemRoleType } from "../domain/system-role-type";
import type { UserProfileRole } from "../domain/user-profile-role";

export type DomainUser = {
  id: string;
  email: string;
  systemRoles: SystemRoleType[];
};

/** Full onboarding profile row for company layout + onboarding wizard. */
export type OnboardingProfileSnapshot = {
  id: string;
  userId: string;
  currentStep: number;
  completedAt: Date | null;
  companyName: string | null;
  industrySector: string | null;
  commercialTeamSize: string | null;
  averageSalesCycle: string | null;
  averageDealSize: string | null;
  companyPitch: string | null;
  objections: unknown;
  keyArguments: unknown;
  industryVocabulary: string | null;
  meetingTypes: unknown;
  pipelineStages: unknown;
  inviteEmails: unknown;
  inviteMessage: string | null;
};

export type UserWithOnboardingRow = DomainUser & {
  registerProfileCompletedAt: Date | null;
  onboardingProfile: OnboardingProfileSnapshot | null;
};

export interface UserRepositoryPort {
  findById(userId: string): Promise<DomainUser | null>;

  findUserWithOnboardingByUserId(
    userId: string,
  ): Promise<UserWithOnboardingRow | null>;

  /** Post–sign-up register profile gate + onboarding redirect. */
  findRegisterGateByUserId(userId: string): Promise<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    registerProfileCompletedAt: Date | null;
    onboardingProfile: { completedAt: Date | null } | null;
  } | null>;

  completeRegisterProfile(input: {
    userId: string;
    firstName: string;
    lastName: string;
    profileRole: UserProfileRole;
  }): Promise<void>;
}
