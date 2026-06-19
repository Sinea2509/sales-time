import { GLOBAL_PROMPT_AUDIT_ORG_ID } from "@/src/core/domain/global-audit-ids";
import {
  kissCoachingPromptsToJson,
  type KissCoachingPromptsForm,
} from "@/src/core/domain/kiss-org-coaching-prompts";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";

export type SaveGlobalKissCoachingPromptsResult =
  | { ok: true }
  | {
      ok: false;
      error: "NOT_SUPER_ADMIN" | "USER_NOT_SYNCED" | "PERSIST_FAILED";
      message?: string;
    };

export async function saveGlobalKissCoachingPrompts(
  deps: {
    globalKissCoachingPrompts: GlobalKissCoachingPromptsRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: {
    actorInternalUserId: string | null;
    isSuperAdmin: boolean;
    form: KissCoachingPromptsForm;
  },
): Promise<SaveGlobalKissCoachingPromptsResult> {
  if (!input.actorInternalUserId) {
    return { ok: false, error: "USER_NOT_SYNCED" };
  }
  if (!input.isSuperAdmin) {
    return { ok: false, error: "NOT_SUPER_ADMIN" };
  }

  const json = kissCoachingPromptsToJson(input.form);
  try {
    await deps.globalKissCoachingPrompts.setPrompts(json);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "PERSIST_FAILED", message };
  }

  await deps.audit.logPlatformAction({
    actorUserId: input.actorInternalUserId,
    organizationId: GLOBAL_PROMPT_AUDIT_ORG_ID,
    action: "PUBLISH_KISS_QUADRANT_PROMPTS",
    reason: "Consignes KISS par quadrant (plateforme)",
  });

  return { ok: true };
}
