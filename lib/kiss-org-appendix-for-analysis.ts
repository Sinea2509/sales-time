import {
  buildKissOrgMarkdownAppendix,
  kissCoachingPromptsFromJson,
} from "@/src/core/domain/kiss-org-coaching-prompts";

/**
 * Annexe markdown pour l’analyse KISS (commercial) ou les synthèses manager,
 * à partir du JSON global (super admin).
 */
export function kissMarkdownAppendixForAudience(
  kissCoachingPromptsJson: unknown | null | undefined,
  audience: "commercial" | "manager",
): string | null {
  const form = kissCoachingPromptsFromJson(
    kissCoachingPromptsJson ?? undefined,
  );
  const s = buildKissOrgMarkdownAppendix(form, audience).trim();
  return s.length > 0 ? s : null;
}
