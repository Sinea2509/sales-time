import { prisma } from "@/lib/prisma";
import { PrismaAdminSearchRepository } from "@/src/adapters/prisma/prisma-admin-search-repository";
import { PrismaPlatformHealthRepository } from "@/src/adapters/prisma/prisma-platform-health-repository";
import { PrismaOrganizationTeamRepository } from "@/src/adapters/prisma/prisma-organization-team-repository";
import { PrismaBackofficeRepository } from "@/src/adapters/prisma/prisma-backoffice-repository";
import { makeSessionAuthAdapter } from "@/src/adapters/auth/session-auth-adapter";
import { PrismaSessionRepository } from "@/src/adapters/prisma/prisma-session-repository";
import { makePrismaOrganizationDirectoryPort } from "@/src/adapters/prisma/prisma-organization-directory";
import { PrismaAuditRepository } from "@/src/adapters/prisma/prisma-audit-repository";
import { PrismaContactRepository } from "@/src/adapters/prisma/prisma-contact-repository";
import { PrismaMeetingRepository } from "@/src/adapters/prisma/prisma-meeting-repository";
import { PrismaPasswordResetRepository } from "@/src/adapters/prisma/prisma-password-reset-repository";
import { PrismaOnboardingCompletionRepository } from "@/src/adapters/prisma/prisma-onboarding-completion-repository";
import { PrismaOnboardingProfileRepository } from "@/src/adapters/prisma/prisma-onboarding-profile-repository";
import { PrismaOnboardingSharedPhraseRepository } from "@/src/adapters/prisma/prisma-onboarding-shared-phrase-repository";
import { PrismaOrganizationSettingsRepository } from "@/src/adapters/prisma/prisma-organization-settings-repository";
import { PrismaRegistrationRepository } from "@/src/adapters/prisma/prisma-registration-repository";
import { PrismaGlobalKissCoachingPromptsRepository } from "@/src/adapters/prisma/prisma-global-kiss-coaching-prompts-repository";
import { PrismaAnalysisJobRepository } from "@/src/adapters/prisma/prisma-analysis-job-repository";
import { PrismaAiRequestLogRepository } from "@/src/adapters/prisma/prisma-ai-request-log-repository";
import { PrismaPlanRequestRepository } from "@/src/adapters/prisma/prisma-plan-request-repository";
import { PrismaFeedbackRepository } from "@/src/adapters/prisma/prisma-feedback-repository";
import { PrismaNotificationRepository } from "@/src/adapters/prisma/prisma-notification-repository";
import { PrismaOrganizationQuotaRepository } from "@/src/adapters/prisma/prisma-organization-quota-repository";
import { PrismaAiSummaryCacheRepository } from "@/src/adapters/prisma/prisma-ai-summary-cache-repository";
import { PrismaPromptTemplateRepository } from "@/src/adapters/prisma/prisma-prompt-template-repository";
import { PrismaSignInReadRepository } from "@/src/adapters/prisma/prisma-sign-in-read-repository";
import { PrismaOrganizationInvitationRepository } from "@/src/adapters/prisma/prisma-organization-invitation-repository";
import { PrismaSuperAdminInvitationRepository } from "@/src/adapters/prisma/prisma-super-admin-invitation-repository";
import { PrismaUserRepository } from "@/src/adapters/prisma/prisma-user-repository";
import { VercelAIAnalysisAdapter } from "@/src/adapters/vercel/vercel-ai-analysis-adapter";
import type { AdminSearchRepositoryPort } from "@/src/core/ports/admin-search-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OnboardingCompletionRepositoryPort } from "@/src/core/ports/onboarding-completion-repository-port";
import type { OnboardingProfileRepositoryPort } from "@/src/core/ports/onboarding-profile-repository-port";
import type { OnboardingSharedPhraseRepositoryPort } from "@/src/core/ports/onboarding-shared-phrase-repository-port";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";
import type { OrganizationInvitationRepositoryPort } from "@/src/core/ports/organization-invitation-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { SuperAdminInvitationRepositoryPort } from "@/src/core/ports/super-admin-invitation-repository-port";
import type { PlatformHealthRepositoryPort } from "@/src/core/ports/platform-health-repository-port";
import type { PasswordResetRepositoryPort } from "@/src/core/ports/password-reset-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { RegistrationRepositoryPort } from "@/src/core/ports/registration-repository-port";
import type { SignInReadPort } from "@/src/core/ports/sign-in-read-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";
import type { SessionRepositoryPort } from "@/src/core/ports/session-repository-port";
import type { BackofficeRepositoryPort } from "@/src/core/ports/backoffice-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { PlanRequestRepositoryPort } from "@/src/core/ports/plan-request-repository-port";
import type { FeedbackRepositoryPort } from "@/src/core/ports/feedback-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

export type ApplicationDeps = {
  auth: AuthSessionPort;
  session: SessionRepositoryPort;
  users: UserRepositoryPort;
  audit: AuditRepositoryPort;
  orgDirectory: OrganizationDirectoryPort;
  meetings: MeetingRepositoryPort;
  contacts: ContactRepositoryPort;
  prompts: PromptTemplateRepositoryPort;
  analysis: AnalysisPort;
  organizationSettings: OrganizationSettingsRepositoryPort;
  onboardingProfiles: OnboardingProfileRepositoryPort;
  onboardingCompletion: OnboardingCompletionRepositoryPort;
  onboardingSharedPhrases: OnboardingSharedPhraseRepositoryPort;
  organizationInvitations: OrganizationInvitationRepositoryPort;
  superAdminInvitations: SuperAdminInvitationRepositoryPort;
  passwordReset: PasswordResetRepositoryPort;
  signInRead: SignInReadPort;
  registration: RegistrationRepositoryPort;
  platformHealth: PlatformHealthRepositoryPort;
  adminSearch: AdminSearchRepositoryPort;
  organizationTeam: OrganizationTeamRepositoryPort;
  backoffice: BackofficeRepositoryPort;
  globalKissCoachingPrompts: GlobalKissCoachingPromptsRepositoryPort;
  analysisJobs: AnalysisJobRepositoryPort;
  aiLogs: AiRequestLogRepositoryPort;
  planRequests: PlanRequestRepositoryPort;
  feedbacks: FeedbackRepositoryPort;
  notifications: NotificationRepositoryPort;
  organizationQuota: OrganizationQuotaRepositoryPort;
  aiSummaryCache: AiSummaryCacheRepositoryPort;
};

export function makeApplicationDeps(): ApplicationDeps {
  const session = new PrismaSessionRepository(prisma);
  return {
    auth: makeSessionAuthAdapter(session),
    session,
    users: new PrismaUserRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    orgDirectory: makePrismaOrganizationDirectoryPort(prisma),
    meetings: new PrismaMeetingRepository(prisma),
    contacts: new PrismaContactRepository(prisma),
    prompts: new PrismaPromptTemplateRepository(prisma),
    analysis: new VercelAIAnalysisAdapter(),
    organizationSettings: new PrismaOrganizationSettingsRepository(prisma),
    onboardingProfiles: new PrismaOnboardingProfileRepository(prisma),
    onboardingCompletion: new PrismaOnboardingCompletionRepository(prisma),
    onboardingSharedPhrases: new PrismaOnboardingSharedPhraseRepository(prisma),
    organizationInvitations: new PrismaOrganizationInvitationRepository(prisma),
    superAdminInvitations: new PrismaSuperAdminInvitationRepository(prisma),
    passwordReset: new PrismaPasswordResetRepository(prisma),
    signInRead: new PrismaSignInReadRepository(prisma),
    registration: new PrismaRegistrationRepository(prisma),
    platformHealth: new PrismaPlatformHealthRepository(prisma),
    adminSearch: new PrismaAdminSearchRepository(prisma),
    organizationTeam: new PrismaOrganizationTeamRepository(prisma),
    backoffice: new PrismaBackofficeRepository(prisma),
    globalKissCoachingPrompts: new PrismaGlobalKissCoachingPromptsRepository(
      prisma,
    ),
    analysisJobs: new PrismaAnalysisJobRepository(prisma),
    aiLogs: new PrismaAiRequestLogRepository(prisma),
    planRequests: new PrismaPlanRequestRepository(prisma),
    feedbacks: new PrismaFeedbackRepository(prisma),
    notifications: new PrismaNotificationRepository(prisma),
    organizationQuota: new PrismaOrganizationQuotaRepository(prisma),
    aiSummaryCache: new PrismaAiSummaryCacheRepository(prisma),
  };
}
