import { GLOBAL_PROMPT_AUDIT_ORG_ID } from "@/src/core/domain/global-audit-ids";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

export type PublishGlobalPromptResult =
  | { ok: true; version: number }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "USER_NOT_SYNCED" };

export async function publishGlobalPromptVersion(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: {
    actorInternalUserId: string | null;
    isSuperAdmin: boolean;
    kind: AnalysisKindSlug;
    markdown: string;
    auditAction: "PUBLISH_PROMPT" | "RESTORE_PROMPT";
  },
): Promise<PublishGlobalPromptResult> {
  if (!input.actorInternalUserId) {
    return { ok: false, error: "USER_NOT_SYNCED" };
  }
  if (!input.isSuperAdmin) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  const row = await deps.prompts.publishNewVersion({
    kind: input.kind,
    markdown: input.markdown,
    authorUserId: input.actorInternalUserId,
  });

  await deps.audit.logSuperAdminAction({
    actorInternalUserId: input.actorInternalUserId,
    organizationId: GLOBAL_PROMPT_AUDIT_ORG_ID,
    action: input.auditAction,
    reason: `${input.kind} prompt v${row.version}`,
  });

  return { ok: true, version: row.version };
}
