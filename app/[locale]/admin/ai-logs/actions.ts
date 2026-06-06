"use server";

import { revalidatePath } from "next/cache";
import { getApplicationDeps } from "@/lib/application-deps";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { generateObject } from "ai";
import { z } from "zod";

export async function replayAiLogAction(logId: string) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false as const, error: "FORBIDDEN" };
  }

  const log = await deps.aiLogs.findById(logId);
  if (!log?.userPrompt) {
    return { ok: false as const, error: "NOT_FOUND" };
  }

  const started = Date.now();
  try {
    const { object, usage } = await generateObject({
      model: ANALYSIS_GATEWAY_MODEL,
      schema: z.object({ replay: z.string() }),
      system: log.systemPrompt ?? "Replay SalesTime AI call.",
      prompt: log.userPrompt,
    });

    await deps.aiLogs.createLog({
      organizationId: log.organizationId,
      meetingId: log.meetingId,
      jobId: log.jobId,
      kind: log.kind,
      status: "SUCCESS",
      modelName: ANALYSIS_GATEWAY_MODEL,
      promptVersion: `${log.promptVersion}-replay`,
      systemPrompt: log.systemPrompt,
      userPrompt: log.userPrompt,
      rawOutput: object,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    await deps.aiLogs.createLog({
      organizationId: log.organizationId,
      meetingId: log.meetingId,
      jobId: log.jobId,
      kind: log.kind,
      status: "ERROR",
      modelName: ANALYSIS_GATEWAY_MODEL,
      promptVersion: `${log.promptVersion}-replay`,
      systemPrompt: log.systemPrompt,
      userPrompt: log.userPrompt,
      errorMessage: err instanceof Error ? err.message : "Replay failed",
      latencyMs: Date.now() - started,
    });
    return { ok: false as const, error: "REPLAY_FAILED" };
  }

  revalidatePath("/admin/ai-logs");
  return { ok: true as const };
}
