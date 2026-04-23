import { prisma } from "@/lib/prisma";
import { sessionAuthAdapter } from "@/src/adapters/auth/session-auth-adapter";
import { makePrismaOrganizationDirectoryPort } from "@/src/adapters/prisma/prisma-organization-directory";
import { PrismaAuditRepository } from "@/src/adapters/prisma/prisma-audit-repository";
import { PrismaMeetingRepository } from "@/src/adapters/prisma/prisma-meeting-repository";
import { PrismaOnboardingProfileRepository } from "@/src/adapters/prisma/prisma-onboarding-profile-repository";
import { PrismaOnboardingSharedPhraseRepository } from "@/src/adapters/prisma/prisma-onboarding-shared-phrase-repository";
import { PrismaOrganizationSettingsRepository } from "@/src/adapters/prisma/prisma-organization-settings-repository";
import { PrismaPromptTemplateRepository } from "@/src/adapters/prisma/prisma-prompt-template-repository";
import { PrismaUserRepository } from "@/src/adapters/prisma/prisma-user-repository";
import { VercelAIAnalysisAdapter } from "@/src/adapters/vercel/vercel-ai-analysis-adapter";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OnboardingProfileRepositoryPort } from "@/src/core/ports/onboarding-profile-repository-port";
import type { OnboardingSharedPhraseRepositoryPort } from "@/src/core/ports/onboarding-shared-phrase-repository-port";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";

export type ApplicationDeps = {
  auth: AuthSessionPort;
  users: UserRepositoryPort;
  audit: AuditRepositoryPort;
  orgDirectory: OrganizationDirectoryPort;
  meetings: MeetingRepositoryPort;
  prompts: PromptTemplateRepositoryPort;
  analysis: AnalysisPort;
  organizationSettings: OrganizationSettingsRepositoryPort;
  onboardingProfiles: OnboardingProfileRepositoryPort;
  onboardingSharedPhrases: OnboardingSharedPhraseRepositoryPort;
};

export function makeApplicationDeps(): ApplicationDeps {
  return {
    auth: sessionAuthAdapter,
    users: new PrismaUserRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    orgDirectory: makePrismaOrganizationDirectoryPort(prisma),
    meetings: new PrismaMeetingRepository(prisma),
    prompts: new PrismaPromptTemplateRepository(prisma),
    analysis: new VercelAIAnalysisAdapter(),
    organizationSettings: new PrismaOrganizationSettingsRepository(prisma),
    onboardingProfiles: new PrismaOnboardingProfileRepository(prisma),
    onboardingSharedPhrases: new PrismaOnboardingSharedPhraseRepository(prisma),
  };
}
