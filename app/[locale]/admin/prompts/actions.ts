"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { analysisGatewayModelSchema } from "@/lib/analysis-gateway-models";
import { publishGlobalPromptVersion } from "@/src/core/application/publish-global-prompt-version";
import { updateGlobalPromptModel } from "@/src/core/application/update-global-prompt-model";
import { ANALYSIS_KIND_SLUGS } from "@/src/core/ports/prompt-template-repository-port";

const publishPromptSchema = z.object({
  kind: z.enum(ANALYSIS_KIND_SLUGS),
  markdown: z.string().min(1).max(200_000),
  auditAction: z.enum(["PUBLISH_PROMPT", "RESTORE_PROMPT"]),
});

export type PublishPromptInput = z.input<typeof publishPromptSchema>;

const updatePromptModelSchema = z.object({
  kind: z.enum(ANALYSIS_KIND_SLUGS),
  model: analysisGatewayModelSchema,
});

export type UpdatePromptModelInput = z.input<typeof updatePromptModelSchema>;

export async function publishPromptAction(input: PublishPromptInput) {
  const parsed = publishPromptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  const userRow = await deps.users.findById(principal.userId);
  if (!userRow) return { ok: false as const, error: "NO_USER" };

  const isSuperAdmin = userRow.systemRoles.includes("SUPER_ADMIN");
  const result = await publishGlobalPromptVersion(deps, {
    actorInternalUserId: userRow.id,
    isSuperAdmin,
    kind: parsed.data.kind,
    markdown: parsed.data.markdown,
    auditAction: parsed.data.auditAction,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/admin/prompts");
  return { ok: true as const, version: result.version };
}

export async function updatePromptModelAction(input: UpdatePromptModelInput) {
  const parsed = updatePromptModelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  const userRow = await deps.users.findById(principal.userId);
  if (!userRow) return { ok: false as const, error: "NO_USER" };

  const isSuperAdmin = userRow.systemRoles.includes("SUPER_ADMIN");
  const result = await updateGlobalPromptModel(deps, {
    actorInternalUserId: userRow.id,
    isSuperAdmin,
    kind: parsed.data.kind,
    model: parsed.data.model,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/admin/prompts");
  return { ok: true as const, model: result.model };
}
