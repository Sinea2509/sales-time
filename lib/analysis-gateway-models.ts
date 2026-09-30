import { z } from "zod";

/** Default when a prompt template has no model configured in DB. */
export const DEFAULT_ANALYSIS_GATEWAY_MODEL = "openai/gpt-4o-mini" as const;

/** @deprecated Use DEFAULT_ANALYSIS_GATEWAY_MODEL; kept for existing imports. */
export const ANALYSIS_GATEWAY_MODEL = DEFAULT_ANALYSIS_GATEWAY_MODEL;

/**
 * Le modèle qui transcrit un enregistrement audio en texte.
 *
 * Gemini lit l'audio en entrée sans service de transcription à part : la
 * même passerelle, la même clé que les analyses. Un modèle qui n'accepte pas
 * l'audio renverrait une erreur, pas un transcript approximatif.
 */
export const DEFAULT_TRANSCRIPTION_MODEL = "google/gemini-2.5-flash" as const;

export type AnalysisGatewayModelOption = {
  id: string;
  label: string;
  provider: string;
};

/** Curated models available via Vercel AI Gateway (provider/model format). */
export const ANALYSIS_GATEWAY_MODEL_OPTIONS: readonly AnalysisGatewayModelOption[] =
  [
    {
      id: "openai/gpt-4o-mini",
      label: "GPT-4o mini",
      provider: "OpenAI",
    },
    {
      id: "openai/gpt-4o",
      label: "GPT-4o",
      provider: "OpenAI",
    },
    {
      id: "openai/gpt-5.4",
      label: "GPT-5.4",
      provider: "OpenAI",
    },
    {
      id: "anthropic/claude-haiku-4.5",
      label: "Claude Haiku 4.5",
      provider: "Anthropic",
    },
    {
      id: "anthropic/claude-sonnet-4.6",
      label: "Claude Sonnet 4.6",
      provider: "Anthropic",
    },
    {
      id: "google/gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      provider: "Google",
    },
    {
      id: "google/gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      provider: "Google",
    },
    {
      id: "mistral/mistral-small",
      label: "Mistral Small",
      provider: "Mistral",
    },
  ] as const;

const gatewayModelIdPattern = /^[a-z0-9-]+\/[a-z0-9.-]+$/i;

export const analysisGatewayModelSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(gatewayModelIdPattern, "INVALID_GATEWAY_MODEL");

export function isKnownGatewayModel(model: string): boolean {
  return ANALYSIS_GATEWAY_MODEL_OPTIONS.some((o) => o.id === model);
}

export function gatewayModelLabel(model: string): string {
  const known = ANALYSIS_GATEWAY_MODEL_OPTIONS.find((o) => o.id === model);
  if (known) return `${known.label} (${known.id})`;
  return model;
}
