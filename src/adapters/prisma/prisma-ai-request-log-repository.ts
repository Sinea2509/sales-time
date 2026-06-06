import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AiRequestLogRepositoryPort,
  AiRequestLogRow,
} from "@/src/core/ports/ai-request-log-repository-port";

export class PrismaAiRequestLogRepository implements AiRequestLogRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async createLog(input: Parameters<AiRequestLogRepositoryPort["createLog"]>[0]): Promise<AiRequestLogRow> {
    const row = await this.db.aiRequestLog.create({
      data: {
        organizationId: input.organizationId ?? null,
        meetingId: input.meetingId ?? null,
        jobId: input.jobId ?? null,
        kind: input.kind,
        status: input.status,
        modelName: input.modelName,
        promptVersion: input.promptVersion ?? "1",
        systemPrompt: input.systemPrompt ?? null,
        userPrompt: input.userPrompt ?? null,
        rawOutput: input.rawOutput as object | undefined,
        errorMessage: input.errorMessage ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        latencyMs: input.latencyMs ?? null,
        temperature: input.temperature ?? null,
      },
    });
    return row as AiRequestLogRow;
  }

  async listLogs(input: {
    limit?: number;
    offset?: number;
    meetingId?: string;
    status?: "SUCCESS" | "ERROR";
  }): Promise<{ rows: AiRequestLogRow[]; total: number }> {
    const where = {
      ...(input.meetingId ? { meetingId: input.meetingId } : {}),
      ...(input.status ? { status: input.status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.aiRequestLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit ?? 50,
        skip: input.offset ?? 0,
      }),
      this.db.aiRequestLog.count({ where }),
    ]);
    return { rows: rows as AiRequestLogRow[], total };
  }

  async findById(id: string): Promise<AiRequestLogRow | null> {
    const row = await this.db.aiRequestLog.findUnique({ where: { id } });
    return row as AiRequestLogRow | null;
  }

  async purgeOlderThan(before: Date): Promise<number> {
    const result = await this.db.aiRequestLog.deleteMany({
      where: { createdAt: { lt: before } },
    });
    return result.count;
  }

  async getAggregateSince(since: Date): Promise<{
    totalCalls: number;
    errorCalls: number;
    inputTokens: number;
    outputTokens: number;
  }> {
    const rows = await this.db.aiRequestLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        inputTokens: true,
        outputTokens: true,
      },
    });
    let inputTokens = 0;
    let outputTokens = 0;
    let errorCalls = 0;
    for (const row of rows) {
      inputTokens += row.inputTokens ?? 0;
      outputTokens += row.outputTokens ?? 0;
      if (row.status === "ERROR") errorCalls += 1;
    }
    return {
      totalCalls: rows.length,
      errorCalls,
      inputTokens,
      outputTokens,
    };
  }
}
