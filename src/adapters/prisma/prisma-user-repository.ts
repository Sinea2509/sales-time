import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  DomainUser,
  OnboardingProfileSnapshot,
  UserRepositoryPort,
  UserWithOnboardingRow,
} from "@/src/core/ports/user-repository-port";
import type { SystemRoleType } from "@/src/core/domain/system-role-type";
import type { UserProfileRole } from "@/src/core/domain/user-profile-role";

function mapRole(role: string): SystemRoleType {
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  throw new Error(`Unknown system role: ${role}`);
}

function mapOnboardingProfile(row: {
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
}): OnboardingProfileSnapshot {
  return {
    id: row.id,
    userId: row.userId,
    currentStep: row.currentStep,
    completedAt: row.completedAt,
    companyName: row.companyName,
    industrySector: row.industrySector,
    commercialTeamSize: row.commercialTeamSize,
    averageSalesCycle: row.averageSalesCycle,
    averageDealSize: row.averageDealSize,
    companyPitch: row.companyPitch,
    objections: row.objections,
    keyArguments: row.keyArguments,
    industryVocabulary: row.industryVocabulary,
    meetingTypes: row.meetingTypes,
    pipelineStages: row.pipelineStages,
    inviteEmails: row.inviteEmails,
    inviteMessage: row.inviteMessage,
  };
}

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findById(userId: string): Promise<DomainUser | null> {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      include: { systemRoles: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      systemRoles: row.systemRoles.map((r) => mapRole(r.role)),
    };
  }

  async findUserWithOnboardingByUserId(
    userId: string,
  ): Promise<UserWithOnboardingRow | null> {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      include: { systemRoles: true, onboardingProfile: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      registerProfileCompletedAt: row.registerProfileCompletedAt,
      systemRoles: row.systemRoles.map((r) => mapRole(r.role)),
      onboardingProfile: row.onboardingProfile
        ? mapOnboardingProfile(row.onboardingProfile)
        : null,
    };
  }

  async findRegisterGateByUserId(
    userId: string,
  ): Promise<{
    id: string;
    registerProfileCompletedAt: Date | null;
    onboardingProfile: { completedAt: Date | null } | null;
  } | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        registerProfileCompletedAt: true,
        onboardingProfile: { select: { completedAt: true } },
      },
    });
  }

  async completeRegisterProfile(input: {
    userId: string;
    firstName: string;
    lastName: string;
    profileRole: UserProfileRole;
  }): Promise<void> {
    await this.db.user.update({
      where: { id: input.userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        profileRole: input.profileRole,
        registerProfileCompletedAt: new Date(),
      },
    });
  }
}
