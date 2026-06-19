import {
  DEFAULT_ANALYSIS_GATEWAY_MODEL,
  analysisGatewayModelSchema,
} from "@/lib/analysis-gateway-models";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

export async function resolvePromptGatewayModel(
  prompts: PromptTemplateRepositoryPort,
  kind: AnalysisKindSlug,
): Promise<string> {
  const model = await prompts.getModelForKind({ kind });
  const parsed = analysisGatewayModelSchema.safeParse(model);
  return parsed.success ? parsed.data : DEFAULT_ANALYSIS_GATEWAY_MODEL;
}
