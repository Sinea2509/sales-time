import type { ApplicationDeps } from "@/lib/application-deps";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";

/**
 * Charge le bloc playbook d'une organisation pour un prompt d'analyse.
 *
 * Renvoie `null` sans organisation active, plutôt que de lever : un appel
 * d'analyse déjà refusé ailleurs pour cette raison ne doit pas échouer ici
 * avec une erreur qui masquerait la vraie cause.
 */
export async function loadOrganizationPlaybookMarkdown(
  deps: Pick<ApplicationDeps, "organizationSettings">,
  organizationId: string | null | undefined,
): Promise<string | null> {
  if (!organizationId) return null;
  const row =
    await deps.organizationSettings.findByOrganizationId(organizationId);
  return organizationPlaybookMarkdownForAnalysis(row);
}
