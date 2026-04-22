import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";

export class PrismaAuditRepository implements AuditRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async logSuperAdminAction(input: {
    actorInternalUserId: string;
    clerkOrgId: string;
    action: "ENTER_ORG" | "EXIT_ORG";
    reason?: string | null;
  }): Promise<void> {
    await this.db.superAdminAuditLog.create({
      data: {
        actorUserId: input.actorInternalUserId,
        clerkOrgId: input.clerkOrgId,
        action: input.action,
        reason: input.reason ?? null,
      },
    });
  }
}
