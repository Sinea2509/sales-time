export type SuperAdminAuditAction = "ENTER_ORG" | "EXIT_ORG";

export interface AuditRepositoryPort {
  logSuperAdminAction(input: {
    actorInternalUserId: string;
    clerkOrgId: string;
    action: SuperAdminAuditAction;
    reason?: string | null;
  }): Promise<void>;
}
