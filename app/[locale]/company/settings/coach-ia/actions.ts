"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsActor } from "@/lib/load-org-settings-access";
import {
  resetOrganizationPrompt,
  saveOrganizationPrompt,
} from "@/src/core/application/organization-prompt-settings";
import {
  ORGANIZATION_PROMPT_KINDS,
  ORGANIZATION_PROMPT_MAX_CHARS,
} from "@/src/core/domain/organization-prompts";

export type OrganizationPromptActionResult =
  | { ok: true; changed: boolean }
  | { ok: false; message: string };

/*
  Le texte est borné ici largement au-dessus de la limite : c'est la règle du
  domaine, avec son message en clair, qui refuse une consigne trop longue. Ce
  plafond-ci ne sert qu'à ne pas traiter une requête démesurée.
*/
const saveSchema = z.object({
  kind: z.enum(ORGANIZATION_PROMPT_KINDS),
  markdown: z.string().max(ORGANIZATION_PROMPT_MAX_CHARS * 5),
});

const resetSchema = z.object({
  kind: z.enum(ORGANIZATION_PROMPT_KINDS),
});

/**
 * Le manager qui agit, et son organisation, lus dans la session.
 *
 * Jamais dans le formulaire : une organisation passée en paramètre
 * permettrait de modifier les consignes d'une autre.
 */
async function requireOrgSettingsManager(): Promise<{
  organizationId: string;
  userId: string;
} | null> {
  const actor = await loadOrgSettingsActor();
  if (!actor?.canManageOrganizationSettings) return null;
  return { organizationId: actor.organizationId, userId: actor.userId };
}

export async function saveOrganizationPromptAction(
  raw: z.input<typeof saveSchema>,
): Promise<OrganizationPromptActionResult> {
  const manager = await requireOrgSettingsManager();
  if (!manager) return { ok: false, message: "Accès refusé." };
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Données invalides." };

  const result = await saveOrganizationPrompt(getApplicationDeps(), {
    organizationId: manager.organizationId,
    actorUserId: manager.userId,
    kind: parsed.data.kind,
    markdown: parsed.data.markdown,
  });
  if (result.ok && result.changed) {
    revalidatePath("/company/settings", "layout");
  }
  return result;
}

export async function resetOrganizationPromptAction(
  raw: z.input<typeof resetSchema>,
): Promise<OrganizationPromptActionResult> {
  const manager = await requireOrgSettingsManager();
  if (!manager) return { ok: false, message: "Accès refusé." };
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Données invalides." };

  const result = await resetOrganizationPrompt(getApplicationDeps(), {
    organizationId: manager.organizationId,
    actorUserId: manager.userId,
    kind: parsed.data.kind,
  });
  if (result.ok && result.changed) {
    revalidatePath("/company/settings", "layout");
  }
  return result;
}
