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
