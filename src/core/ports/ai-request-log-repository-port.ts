export type AiCallKind =
  | "DISC"
  | "SONCAS"
  | "COACHING"
  | "PREPARE"
  | "EMAIL";

export type AiRequestLogRow = {
  id: string;
  organizationId: string | null;
  meetingId: string | null;
  jobId: string | null;
  kind: AiCallKind;
  status: "SUCCESS" | "ERROR";
  modelName: string;
  promptVersion: string;
  systemPrompt: string | null;
  userPrompt: string | null;
  rawOutput: unknown;
  errorMessage: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  temperature: number | null;
  createdAt: Date;
};

export interface AiRequestLogRepositoryPort {
  createLog(input: {
    organizationId?: string | null;
    meetingId?: string | null;
    jobId?: string | null;
    kind: AiCallKind;
    status: "SUCCESS" | "ERROR";
    modelName: string;
    promptVersion?: string;
    systemPrompt?: string | null;
    userPrompt?: string | null;
    rawOutput?: unknown;
    errorMessage?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    latencyMs?: number | null;
    temperature?: number | null;
  }): Promise<AiRequestLogRow>;

  listLogs(input: {
    limit?: number;
    offset?: number;
    meetingId?: string;
    status?: "SUCCESS" | "ERROR";
  }): Promise<{ rows: AiRequestLogRow[]; total: number }>;

  findById(id: string): Promise<AiRequestLogRow | null>;

  purgeOlderThan(before: Date): Promise<number>;

  getAggregateSince(since: Date): Promise<{
    totalCalls: number;
    errorCalls: number;
    inputTokens: number;
    outputTokens: number;
  }>;
}
