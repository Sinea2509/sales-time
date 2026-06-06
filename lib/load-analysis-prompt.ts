import {
  DEFAULT_ANALYSIS_PROMPT_MARKDOWN,
} from "@/lib/default-analysis-prompts";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

export async function loadAnalysisPromptMarkdown(
  prompts: PromptTemplateRepositoryPort,
  kind: AnalysisKindSlug,
): Promise<string> {
  const current = await prompts.getCurrentVersion({ kind });
  if (current?.markdown.trim()) {
    return current.markdown;
  }
  return DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind];
}

const ORG_APPENDIX_HEADER =
  "Consignes spécifiques fournies par l'organisation (à respecter si compatibles avec les données) :";

/** Appends optional org KISS coaching consignes to a system prompt. */
export function appendOrganizationKissPromptAppendix(
  systemMarkdown: string,
  organizationKissPromptAppendix?: string | null,
): string {
  const appendix = organizationKissPromptAppendix?.trim();
  if (!appendix) return systemMarkdown;
  return `${systemMarkdown.trim()}\n\n---\n\n${ORG_APPENDIX_HEADER}\n${appendix}`;
}
