import type {
  AiCallKind,
  AiRequestLogRepositoryPort,
} from "@/src/core/ports/ai-request-log-repository-port";

type LogBase = {
  organizationId: string;
  meetingId: string;
  jobId?: string | null;
  kind: AiCallKind;
  modelName: string;
  promptVersion: string;
  systemPrompt: string;
  userPrompt: string;
};

export async function recordAiRequestSuccess(
  aiLogs: AiRequestLogRepositoryPort | undefined,
  base: LogBase,
  input: {
    rawOutput: unknown;
    inputTokens?: number | null;
    outputTokens?: number | null;
    latencyMs: number;
  },
): Promise<void> {
  if (!aiLogs) return;
  await aiLogs.createLog({
    ...base,
    status: "SUCCESS",
    rawOutput: input.rawOutput,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    latencyMs: input.latencyMs,
  });
}

export async function recordAiRequestError(
  aiLogs: AiRequestLogRepositoryPort | undefined,
  base: LogBase,
  input: { errorMessage: string; latencyMs: number },
): Promise<void> {
  if (!aiLogs) return;
  await aiLogs.createLog({
    ...base,
    status: "ERROR",
    errorMessage: input.errorMessage,
    latencyMs: input.latencyMs,
  });
}
