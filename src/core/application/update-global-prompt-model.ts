import { GLOBAL_PROMPT_AUDIT_ORG_ID } from "@/src/core/domain/global-audit-ids";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

export type UpdateGlobalPromptModelResult =
  | { ok: true; model: string }
  | { ok: false; error: "NOT_SUPER_ADMIN" | "USER_NOT_SYNCED" | "INVALID_MODEL" };

export async function updateGlobalPromptModel(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: {
    actorInternalUserId: string | null;
    isSuperAdmin: boolean;
    kind: AnalysisKindSlug;
    model: string;
  },
): Promise<UpdateGlobalPromptModelResult> {
  if (!input.actorInternalUserId) {
    return { ok: false, error: "USER_NOT_SYNCED" };
  }
  if (!input.isSuperAdmin) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  const model = await deps.prompts.updateModelForKind({
    kind: input.kind,
    model: input.model,
  });

  await deps.audit.logSuperAdminAction({
    actorInternalUserId: input.actorInternalUserId,
    organizationId: GLOBAL_PROMPT_AUDIT_ORG_ID,
    action: "UPDATE_PROMPT_MODEL",
    reason: `${input.kind} model → ${model}`,
  });

  return { ok: true, model };
}
