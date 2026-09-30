import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import {
  isOrganizationPromptKind,
  pickPromptMarkdown,
  type PromptSource,
} from "@/src/core/domain/organization-prompts";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
  PromptTemplateVersionRow,
} from "@/src/core/ports/prompt-template-repository-port";

export type ResolvedAnalysisPrompt = {
  /** Le texte à envoyer au modèle, avant les enrobages du produit. */
  markdown: string;
  /** D'où il vient : l'organisation, le super admin ou le code. */
  source: PromptSource;
  /**
   * La version courante du super admin, même quand l'organisation a sa propre
   * consigne : une analyse enregistrée pointe toujours vers elle.
   */
  globalVersion: PromptTemplateVersionRow | null;
  /** La ligne de l'organisation qui a servi ; null quand ce n'est pas elle. */
  organizationPromptVersionId: string | null;
};

/**
 * La consigne d'une analyse, pour une organisation.
 *
 * La règle tient en trois étages (`pickPromptMarkdown`) : la consigne de
 * l'organisation, sinon celle du super admin, sinon celle du code. Seuls les
 * six types réglables par une organisation lisent ses lignes : pour le
 * briefing ou les synthèses du manager, une ligne égarée dans la table serait
 * ignorée.
 *
 * L'organisation vient de l'appelant, qui la tient de la session ou de la
 * tâche d'analyse, jamais d'un formulaire.
 */
export async function resolveAnalysisPrompt(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    organizationPrompts: OrganizationPromptRepositoryPort;
  },
  input: {
    kind: AnalysisKindSlug;
    organizationId: string | null;
    /**
     * Vrai pour les quatre analyses du rendez-vous : l'analyse enregistrée
     * pointe vers une version du super admin, que la base exige. Sans version
     * publiée, elle est donc créée depuis la consigne du code, comme avant.
     */
    ensureGlobalVersion?: boolean;
  },
): Promise<ResolvedAnalysisPrompt> {
  const codeMarkdown = DEFAULT_ANALYSIS_PROMPT_MARKDOWN[input.kind];
  const { organizationId } = input;
  const [globalVersion, organizationRow] = await Promise.all([
    input.ensureGlobalVersion
      ? deps.prompts.ensureCurrentVersion({
          kind: input.kind,
          defaultMarkdown: codeMarkdown,
        })
      : deps.prompts.getCurrentVersion({ kind: input.kind }),
    organizationId && isOrganizationPromptKind(input.kind)
      ? deps.organizationPrompts.findLatest({
          organizationId,
          kind: input.kind,
        })
      : Promise.resolve(null),
  ]);

  const picked = pickPromptMarkdown({
    organizationMarkdown: organizationRow?.markdown,
    globalMarkdown: globalVersion?.markdown,
    codeMarkdown,
  });
  return {
    ...picked,
    globalVersion,
    organizationPromptVersionId:
      picked.source === "organization" && organizationRow
        ? organizationRow.id
        : null,
  };
}
