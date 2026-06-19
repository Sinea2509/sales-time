import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";

export class PrismaAuditRepository implements AuditRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async logPlatformAction(input: {
    actorUserId: string;
    organizationId: string;
    action: string;
    reason?: string | null;
  }): Promise<void> {
    await this.db.superAdminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        organizationId: input.organizationId,
        action: input.action,
        reason: input.reason ?? null,
      },
    });
  }
}
