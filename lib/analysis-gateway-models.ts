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

/** Ce qu'un modèle coûte, en dollars par million de tokens. */
type ModelRate = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

export type AnalysisGatewayModelOption = ModelRate & {
  id: string;
  label: string;
  provider: string;
};

/**
 * Curated models available via Vercel AI Gateway (provider/model format).
 *
 * Les tarifs sont ceux que la passerelle publie (`/v1/models`, relevés le
 * 30 octobre 2026), hors cache : le produit n'en utilise pas.
 */
export const ANALYSIS_GATEWAY_MODEL_OPTIONS: readonly AnalysisGatewayModelOption[] =
  [
    {
      id: "openai/gpt-4o-mini",
      label: "GPT-4o mini",
      provider: "OpenAI",
      inputUsdPerMillion: 0.15,
      outputUsdPerMillion: 0.6,
    },
    {
      id: "openai/gpt-4o",
      label: "GPT-4o",
      provider: "OpenAI",
      inputUsdPerMillion: 2.5,
      outputUsdPerMillion: 10,
    },
    {
      id: "openai/gpt-5.4",
      label: "GPT-5.4",
      provider: "OpenAI",
      inputUsdPerMillion: 2.5,
      outputUsdPerMillion: 15,
    },
    {
      id: "anthropic/claude-haiku-4.5",
      label: "Claude Haiku 4.5",
      provider: "Anthropic",
      inputUsdPerMillion: 1,
      outputUsdPerMillion: 5,
    },
    {
      id: "anthropic/claude-sonnet-4.6",
      label: "Claude Sonnet 4.6",
      provider: "Anthropic",
      inputUsdPerMillion: 3,
      outputUsdPerMillion: 15,
    },
    {
      id: "anthropic/claude-haiku-5.5",
      label: "Claude Haiku 5.5",
      provider: "Anthropic",
      inputUsdPerMillion: 0.1,
      outputUsdPerMillion: 0.5,
    },
    {
      id: "anthropic/claude-sonnet-5.5",
      label: "Claude Sonnet 5.5",
      provider: "Anthropic",
      inputUsdPerMillion: 2,
      outputUsdPerMillion: 10,
    },
    {
      id: "google/gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      provider: "Google",
      inputUsdPerMillion: 0.3,
      outputUsdPerMillion: 2.5,
    },
    {
      id: "google/gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      provider: "Google",
      inputUsdPerMillion: 1.25,
      outputUsdPerMillion: 10,
    },
    {
      id: "mistral/mistral-small",
      label: "Mistral Small",
      provider: "Mistral",
      inputUsdPerMillion: 0.15,
      outputUsdPerMillion: 0.6,
    },
  ] as const;

/** Pour un modèle sorti de la liste, un journal ancien : un ordre de grandeur. */
const UNLISTED_MODEL_RATE: ModelRate = {
  inputUsdPerMillion: 2,
  outputUsdPerMillion: 8,
};

export function estimatedModelCostUsd(usage: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const rate =
    ANALYSIS_GATEWAY_MODEL_OPTIONS.find((o) => o.id === usage.model) ??
    UNLISTED_MODEL_RATE;
  return (
    (usage.inputTokens * rate.inputUsdPerMillion +
      usage.outputTokens * rate.outputUsdPerMillion) /
    1_000_000
  );
}

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
