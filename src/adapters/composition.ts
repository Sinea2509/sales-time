import { prisma } from "@/lib/prisma";
import { clerkAuthSessionAdapter } from "@/src/adapters/clerk/clerk-auth-session-adapter";
import { makeClerkOrganizationDirectoryPort } from "@/src/adapters/clerk/clerk-organization-directory";
import { PrismaAuditRepository } from "@/src/adapters/prisma/prisma-audit-repository";
import { PrismaUserRepository } from "@/src/adapters/prisma/prisma-user-repository";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";

export type ApplicationDeps = {
  auth: AuthSessionPort;
  users: UserRepositoryPort;
  audit: AuditRepositoryPort;
  orgDirectory: OrganizationDirectoryPort;
};

export function makeApplicationDeps(): ApplicationDeps {
  return {
    auth: clerkAuthSessionAdapter,
    users: new PrismaUserRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
    orgDirectory: makeClerkOrganizationDirectoryPort(),
  };
}
