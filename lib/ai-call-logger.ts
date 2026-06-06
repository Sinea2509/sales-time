import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";

type LogContext = {
  organizationId?: string | null;
  meetingId?: string | null;
  jobId?: string | null;
  kind: Parameters<AiRequestLogRepositoryPort["createLog"]>[0]["kind"];
  modelName: string;
  promptVersion?: string;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  temperature?: number | null;
};

export async function withAiRequestLog<T>(
  aiLogs: AiRequestLogRepositoryPort,
  ctx: LogContext,
  fn: () => Promise<{ result: T; rawText?: string; usage?: { inputTokens?: number; outputTokens?: number } }>,
): Promise<{ result: T; rawText?: string }> {
  const started = Date.now();
  try {
    const out = await fn();
    await aiLogs.createLog({
      ...ctx,
      status: "SUCCESS",
      rawOutput: out.result,
      latencyMs: Date.now() - started,
      inputTokens: out.usage?.inputTokens ?? null,
      outputTokens: out.usage?.outputTokens ?? null,
    });
    return out;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await aiLogs.createLog({
      ...ctx,
      status: "ERROR",
      errorMessage: message,
      latencyMs: Date.now() - started,
    });
    throw e;
  }
}

export type AnalysisPortWithLogging = AnalysisPort;
