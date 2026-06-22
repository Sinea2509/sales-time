import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AnalysisJobRepositoryPort,
  AnalysisJobRow,
} from "@/src/core/ports/analysis-job-repository-port";

function mapJob(row: {
  id: string;
  organizationId: string;
  meetingId: string;
  jobType: string;
  status: AnalysisJobRow["status"];
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
}): AnalysisJobRow {
  return { ...row };
}

export class PrismaAnalysisJobRepository implements AnalysisJobRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async enqueueMeetingAnalysis(input: {
    organizationId: string;
    meetingId: string;
    priority?: number;
  }): Promise<AnalysisJobRow> {
    const existing = await this.db.analysisJob.findFirst({
      where: {
        meetingId: input.meetingId,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
    });
    if (existing) return mapJob(existing);

    const row = await this.db.analysisJob.create({
      data: {
        organizationId: input.organizationId,
        meetingId: input.meetingId,
        priority: input.priority ?? 0,
      },
    });
    return mapJob(row);
  }

  async dequeueNextJob(workerId: string): Promise<AnalysisJobRow | null> {
    const rows = await this.db.$queryRaw<
      Array<{
        id: string;
        organizationId: string;
        meetingId: string;
        jobType: string;
        status: AnalysisJobRow["status"];
        priority: number;
        attempts: number;
        maxAttempts: number;
        runAfter: Date;
        lockedAt: Date | null;
        lockedBy: string | null;
        lastError: string | null;
      }>
    >`
      WITH next_job AS (
        SELECT id FROM "AnalysisJob"
        WHERE status = 'QUEUED' AND "runAfter" <= NOW()
        ORDER BY priority DESC, "runAfter" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "AnalysisJob" j
      SET status = 'PROCESSING',
          "lockedAt" = NOW(),
          "lockedBy" = ${workerId},
          attempts = attempts + 1,
          "updatedAt" = NOW()
      FROM next_job
      WHERE j.id = next_job.id
      RETURNING j.*;
    `;
    const row = rows[0];
    return row ? mapJob(row) : null;
  }

  async markJobDone(jobId: string): Promise<void> {
    await this.db.analysisJob.update({
      where: { id: jobId },
      data: { status: "DONE", lockedAt: null, lockedBy: null },
    });
  }

  async markJobFailed(input: {
    jobId: string;
    error: string;
    requeue: boolean;
    runAfter?: Date;
  }): Promise<void> {
    const job = await this.db.analysisJob.findUnique({ where: { id: input.jobId } });
    if (!job) return;

    const dead = !input.requeue || job.attempts >= job.maxAttempts;
    await this.db.analysisJob.update({
      where: { id: input.jobId },
      data: {
        status: dead ? "DEAD" : "QUEUED",
        lastError: input.error.slice(0, 4000),
        lockedAt: null,
        lockedBy: null,
        runAfter: input.runAfter ?? new Date(Date.now() + 60_000 * 2 ** job.attempts),
      },
    });
  }

  async releaseStaleProcessingJobs(staleBefore: Date): Promise<number> {
    const result = await this.db.analysisJob.updateMany({
      where: {
        status: "PROCESSING",
        lockedAt: { lt: staleBefore },
      },
      data: {
        status: "QUEUED",
        lockedAt: null,
        lockedBy: null,
      },
    });
    return result.count;
  }

  async reconcileStuckProcessingMeetings(input: {
    staleBefore: Date;
    limit: number;
  }): Promise<number> {
    const stuckMeetings = await this.db.meeting.findMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: input.staleBefore },
        analysisJobs: {
          none: { status: { in: ["QUEUED", "PROCESSING"] } },
        },
      },
      select: { id: true, organizationId: true },
      take: input.limit,
      orderBy: { updatedAt: "asc" },
    });

    for (const meeting of stuckMeetings) {
      await this.enqueueMeetingAnalysis({
        organizationId: meeting.organizationId,
        meetingId: meeting.id,
      });
    }

    return stuckMeetings.length;
  }
}
