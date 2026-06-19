import type { PlatformAuditAction } from "@/src/core/domain/platform-audit-actions";

export interface AuditRepositoryPort {
  logPlatformAction(input: {
    actorUserId: string;
    organizationId: string;
    action: PlatformAuditAction | (string & {});
    reason?: string | null;
  }): Promise<void>;
}
