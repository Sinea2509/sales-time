import type { ApplicationDeps } from "@/lib/application-deps";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";

export async function loadCommercialKissAppendix(
  deps: ApplicationDeps,
): Promise<string> {
  const globalKissJson = await deps.globalKissCoachingPrompts.getPrompts();
  const appendix = kissMarkdownAppendixForAudience(globalKissJson, "commercial");
  return appendix ?? "";
}
