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

  findEmailById(userId: string): Promise<string | null>;

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

  findAccountProfileByUserId(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null>;

  updateAccountProfile(input: {
    userId: string;
    firstName: string;
    lastName: string;
  }): Promise<void>;

  updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void>;

  findPasswordHashByUserId(userId: string): Promise<string | null>;

  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;

  listDirectReportUserIds(managerUserId: string): Promise<string[]>;

  /**
   * Manager of a seller, or null when none is set.
   *
   * Lets a seller's dashboard rank them on the exact team their manager sees,
   * so the two screens cannot announce two different places for one person.
   */
  findManagerUserId(userId: string): Promise<string | null>;

  /**
   * Declares who a person reports to, or clears it with null.
   *
   * This is the only writer of the reporting line, and the whole team scoping
   * hangs on it: with nothing written, `listDirectReportUserIds` answers an
   * empty list, every scoped screen falls back to the whole organization, and
   * "Mon équipe" means "everyone".
   *
   * The link belongs to the user rather than to a membership, so this method
   * cannot check that both people share an organization. The caller does, by
   * resolving the assignment against a list it has already scoped to one.
   */
  setManagerUserId(input: {
    userId: string;
    managerUserId: string | null;
  }): Promise<void>;
}
