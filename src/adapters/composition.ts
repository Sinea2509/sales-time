import { prisma } from "@/lib/prisma";
import { clerkAuthSessionAdapter } from "@/src/adapters/clerk/clerk-auth-session-adapter";
import { makeClerkOrganizationDirectoryPort } from "@/src/adapters/clerk/clerk-organization-directory";
import { PrismaAuditRepository } from "@/src/adapters/prisma/prisma-audit-repository";
import { PrismaMeetingRepository } from "@/src/adapters/prisma/prisma-meeting-repository";
import { PrismaPromptTemplateRepository } from "@/src/adapters/prisma/prisma-prompt-template-repository";
import { PrismaUserRepository } from "@/src/adapters/prisma/prisma-user-repository";
import { VercelAIAnalysisAdapter } from "@/src/adapters/vercel/vercel-ai-analysis-adapter";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";
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
};

export function makeApplicationDeps(): ApplicationDeps {
  return {
    auth: clerkAuthSessionAdapter,
    users: new PrismaUserRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    orgDirectory: makeClerkOrganizationDirectoryPort(),
    meetings: new PrismaMeetingRepository(prisma),
    prompts: new PrismaPromptTemplateRepository(prisma),
    analysis: new VercelAIAnalysisAdapter(),
  };
}
