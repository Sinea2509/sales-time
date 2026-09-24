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

const ORGANIZATION_CHANGED_MESSAGE =
  "L'organisation active a changé dans un autre onglet : rechargez la page avant d'enregistrer.";

/*
  Le texte est borné ici largement au-dessus de la limite : c'est la règle du
  domaine, avec son message en clair, qui refuse une consigne trop longue. Ce
  plafond-ci ne sert qu'à ne pas traiter une requête démesurée.

  `expectedOrganizationId` est l'organisation de la page qui a ouvert la
  consigne. Il ne sert jamais à écrire : seulement à refuser l'écriture quand
  la session a changé d'organisation entre-temps.
*/
const saveSchema = z.object({
  expectedOrganizationId: z.string().min(1),
  kind: z.enum(ORGANIZATION_PROMPT_KINDS),
  markdown: z.string().max(ORGANIZATION_PROMPT_MAX_CHARS * 5),
});

const resetSchema = z.object({
  expectedOrganizationId: z.string().min(1),
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

/*
  La session est commune à tous les onglets. Un manager de deux
  organisations, ou un super admin, qui passe sur l'organisation B dans un
  onglet puis enregistre dans l'onglet resté sur A, écrirait le texte de A
  dans B : l'écriture est refusée, et la page rechargée montre B.
*/
function organizationChanged(
  manager: { organizationId: string },
  expectedOrganizationId: string,
): boolean {
  return manager.organizationId !== expectedOrganizationId;
}

export async function saveOrganizationPromptAction(
  raw: z.input<typeof saveSchema>,
): Promise<OrganizationPromptActionResult> {
  const manager = await requireOrgSettingsManager();
  if (!manager) return { ok: false, message: "Accès refusé." };
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Données invalides." };
  if (organizationChanged(manager, parsed.data.expectedOrganizationId)) {
    return { ok: false, message: ORGANIZATION_CHANGED_MESSAGE };
  }

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
  if (organizationChanged(manager, parsed.data.expectedOrganizationId)) {
    return { ok: false, message: ORGANIZATION_CHANGED_MESSAGE };
  }

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
