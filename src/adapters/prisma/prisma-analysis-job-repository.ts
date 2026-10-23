import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AnalysisJobRepositoryPort,
  AnalysisJobRow,
} from "@/src/core/ports/analysis-job-repository-port";

/** « Nom   0:03Texte » : une réplique Teams avec son horodatage sur la même ligne. */
const SAME_LINE_TEAMS_TURN_SQL = String.raw`\S {2,}[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?[^0-9[:space:]]`;

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
          AND attempts < "maxAttempts"
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
    const job = await this.db.analysisJob.findUnique({
      where: { id: input.jobId },
    });
    if (!job) return;

    const dead = !input.requeue || job.attempts >= job.maxAttempts;
    await this.db.analysisJob.update({
      where: { id: input.jobId },
      data: {
        status: dead ? "DEAD" : "QUEUED",
        lastError: input.error.slice(0, 4000),
        lockedAt: null,
        lockedBy: null,
        runAfter:
          input.runAfter ?? new Date(Date.now() + 60_000 * 2 ** job.attempts),
      },
    });
  }

  /**
   * Remet en file les tâches restées verrouillées : leur fonction a été
   * arrêtée (limite de durée dépassée, redéploiement) sans les terminer.
   *
   * Une tâche arrêtée de cette façon ne passe jamais par `markJobFailed`, qui
   * compte les essais. Sans ce compte, une analyse trop longue repartait à
   * chaque passage de la reprise automatique, et la fiche
   * restait « en cours » pour toujours. Une tâche qui a épuisé ses essais est
   * donc abandonnée, et son rendez-vous passe en échec avec un message qui dit
   * quoi faire.
   */
  async releaseStaleProcessingJobs(staleBefore: Date): Promise<number> {
    const stale: {
      id: string;
      meetingId: string;
      attempts: number;
      maxAttempts: number;
    }[] = await this.db.analysisJob.findMany({
      where: { status: "PROCESSING", lockedAt: { lt: staleBefore } },
      select: { id: true, meetingId: true, attempts: true, maxAttempts: true },
    });
    const exhausted = stale.filter((job) => job.attempts >= job.maxAttempts);
    const retryable = stale.filter((job) => job.attempts < job.maxAttempts);

    if (exhausted.length > 0) {
      await this.db.analysisJob.updateMany({
        where: { id: { in: exhausted.map((job) => job.id) } },
        data: {
          status: "DEAD",
          lastError:
            "Arrêtée avant la fin à chaque essai (durée maximale dépassée).",
          lockedAt: null,
          lockedBy: null,
        },
      });
      await this.db.meeting.updateMany({
        where: {
          id: { in: exhausted.map((job) => job.meetingId) },
          status: "PROCESSING",
        },
        data: {
          status: "FAILED",
          errorMessage:
            "L'analyse a dépassé le temps imparti à chaque essai. Relancez-la ; si cela se reproduit, choisissez un modèle plus rapide dans le super admin.",
        },
      });
    }

    for (const job of retryable) {
      await this.db.analysisJob.update({
        where: { id: job.id },
        data: {
          status: "QUEUED",
          lockedAt: null,
          lockedBy: null,
          runAfter: new Date(Date.now() + 60_000 * 2 ** job.attempts),
        },
      });
    }
    return stale.length;
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

  async listMeetingsWithUnreadSpeakers(input: {
    limit: number;
  }): Promise<
    Array<{ id: string; organizationId: string; transcript: string }>
  > {
    /*
      Seule la scorecard la plus récente compte : une ancienne analyse sans
      intervenants, remplacée depuis par une analyse qui les distingue, ne
      doit plus rien déclencher. Une scorecard sans le champ `speakers`
      (antérieure à ce champ) n'est reprise que si le transcript a des
      répliques Teams sur une seule ligne, le cas corrigé.
    */
    return this.db.$queryRaw<
      Array<{ id: string; organizationId: string; transcript: string }>
    >`
      WITH latest AS (
        SELECT DISTINCT ON ("meetingId") "meetingId", result->>'speakers' AS speakers
        FROM "MeetingAnalysis"
        WHERE kind = 'SCORECARD'
        ORDER BY "meetingId", "createdAt" DESC
      )
      SELECT m.id, m."organizationId", m.transcript
      FROM "Meeting" m
      JOIN latest l ON l."meetingId" = m.id
      WHERE m.status = 'READY'
        AND (
          l.speakers = 'none'
          OR (l.speakers IS NULL AND m.transcript ~ ${SAME_LINE_TEAMS_TURN_SQL})
        )
        AND NOT EXISTS (
          SELECT 1 FROM "AnalysisJob" j
          WHERE j."meetingId" = m.id AND j.status IN ('QUEUED', 'PROCESSING')
        )
      ORDER BY m."meetingAt" DESC
      LIMIT ${input.limit}
    `;
  }
}
