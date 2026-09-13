import {
  buildOrganizationPlaybookMarkdown,
  organizationPlaybookContextFromRow,
  organizationPlaybookFromJson,
} from "@/src/core/domain/organization-playbook";
import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

/**
 * Bloc markdown du playbook, prêt à être collé dans un prompt système.
 *
 * Une seule fonction pour tous les chemins d'analyse : le rendu ne doit pas
 * dépendre de l'écran qui a déclenché l'appel. Elle renvoie `null` quand
 * l'organisation n'a rien renseigné, ni dans son playbook ni dans son
 * contexte, pour que le compositeur n'ajoute aucun bloc.
 */
export function organizationPlaybookMarkdownForAnalysis(
  row: OrganizationSettingsRow | null | undefined,
): string | null {
  if (!row) return null;
  const markdown = buildOrganizationPlaybookMarkdown(
    organizationPlaybookFromJson(row.playbook),
    organizationPlaybookContextFromRow(row),
  ).trim();
  return markdown.length > 0 ? markdown : null;
}
