"use server";

import { revalidatePath } from "next/cache";
import { getApplicationDeps } from "@/lib/application-deps";
import { saveGlobalKissCoachingPrompts } from "@/src/core/application/save-global-kiss-coaching-prompts";
import { kissCoachingPromptsFullFormSchema } from "@/src/core/domain/kiss-org-coaching-prompts";
import type { KissCoachingPromptsForm } from "@/src/core/domain/kiss-org-coaching-prompts";

export async function saveGlobalKissConsignesAction(
  raw: KissCoachingPromptsForm,
): Promise<
  | { ok: true }
  | {
      ok: false;
      error: "VALIDATION" | "NOT_SUPER_ADMIN" | "NO_USER" | "SAVE_FAILED";
      message?: string;
    }
> {
  const parsed = kissCoachingPromptsFullFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false, error: "NO_USER" };

  const userRow = await deps.users.findById(principal.userId);
  if (!userRow) return { ok: false, error: "NO_USER" };

  const isSuperAdmin = userRow.systemRoles.includes("SUPER_ADMIN");
  const result = await saveGlobalKissCoachingPrompts(deps, {
    actorInternalUserId: userRow.id,
    isSuperAdmin,
    form: parsed.data,
  });

  if (!result.ok) {
    if (result.error === "PERSIST_FAILED") {
      return {
        ok: false,
        error: "SAVE_FAILED",
        message: result.message,
      };
    }
    return {
      ok: false,
      error: result.error === "NOT_SUPER_ADMIN" ? "NOT_SUPER_ADMIN" : "NO_USER",
    };
  }

  revalidatePath("/admin/prompts/kiss-consignes");
  revalidatePath("/admin/prompts");
  return { ok: true };
}
