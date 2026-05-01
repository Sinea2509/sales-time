export type SuperAdminAuditAction =
  | "ENTER_ORG"
  | "EXIT_ORG"
  | "PUBLISH_PROMPT"
  | "RESTORE_PROMPT"
  | "PUBLISH_KISS_QUADRANT_PROMPTS";

export interface AuditRepositoryPort {
  logSuperAdminAction(input: {
    actorInternalUserId: string;
    organizationId: string;
    action: SuperAdminAuditAction;
    reason?: string | null;
  }): Promise<void>;
}
