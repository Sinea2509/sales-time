import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OnboardingProfileRepositoryPort } from "@/src/core/ports/onboarding-profile-repository-port";

export class PrismaOnboardingProfileRepository
  implements OnboardingProfileRepositoryPort
{
  constructor(private readonly db: PrismaClient) {}

  async getOrCreateProfileForUserId(
    userId: string,
  ): Promise<{ id: string; currentStep: number }> {
    const row = await this.db.onboardingProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true, currentStep: true },
    });
    return row;
  }

  async updateAfterStep1(
    userId: string,
    data: {
      companyName: string;
      industrySector: string | null;
      commercialTeamSize: string | null;
      averageSalesCycle: string | null;
      averageDealSize: string | null;
    },
  ): Promise<void> {
    const profile = await this.getOrCreateProfileForUserId(userId);
    await this.db.onboardingProfile.update({
      where: { id: profile.id },
      data: {
        companyName: data.companyName,
        industrySector: data.industrySector,
        commercialTeamSize: data.commercialTeamSize,
        averageSalesCycle: data.averageSalesCycle,
        averageDealSize: data.averageDealSize,
        currentStep: Math.max(profile.currentStep, 2),
      },
    });
  }

  async updateAfterStep2(
    userId: string,
    data: {
      companyPitch: string | null;
      objections: unknown;
      keyArguments: unknown;
      industryVocabulary: string | null;
    },
  ): Promise<void> {
    const profile = await this.getOrCreateProfileForUserId(userId);
    await this.db.onboardingProfile.update({
      where: { id: profile.id },
      data: {
        companyPitch: data.companyPitch,
        objections: data.objections as object | undefined,
        keyArguments: data.keyArguments as object | undefined,
        industryVocabulary: data.industryVocabulary,
        currentStep: Math.max(profile.currentStep, 3),
      },
    });
  }

  async updateAfterStep3(
    userId: string,
    data: {
      meetingTypes: unknown;
      pipelineStages: unknown;
    },
  ): Promise<void> {
    const profile = await this.getOrCreateProfileForUserId(userId);
    await this.db.onboardingProfile.update({
      where: { id: profile.id },
      data: {
        meetingTypes: data.meetingTypes as object | undefined,
        pipelineStages: data.pipelineStages as object | undefined,
        currentStep: Math.max(profile.currentStep, 4),
      },
    });
  }

  async completeStep4(
    userId: string,
    data: {
      inviteEmails: unknown;
      inviteMessage: string | null;
    },
  ): Promise<void> {
    const profile = await this.getOrCreateProfileForUserId(userId);
    await this.db.onboardingProfile.update({
      where: { id: profile.id },
      data: {
        inviteEmails: data.inviteEmails as object | undefined,
        inviteMessage: data.inviteMessage,
        currentStep: 4,
        completedAt: new Date(),
      },
    });
  }
}
