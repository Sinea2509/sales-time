import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";
import type {
  MeetingAnalysisRow,
  MeetingRepositoryPort,
  MeetingRow,
} from "@/src/core/ports/meeting-repository-port";

function mapMeeting(row: {
  id: string;
  clerkOrgId: string;
  sellerUserId: string;
  prospectName: string;
  meetingAt: Date;
  durationMin: number | null;
  transcript: string;
  notes: string | null;
  outcome: MeetingOutcome;
  createdAt: Date;
  updatedAt: Date;
}): MeetingRow {
  return {
    id: row.id,
    clerkOrgId: row.clerkOrgId,
    sellerUserId: row.sellerUserId,
    prospectName: row.prospectName,
    meetingAt: row.meetingAt,
    durationMin: row.durationMin,
    transcript: row.transcript,
    notes: row.notes,
    outcome: row.outcome,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAnalysis(row: {
  id: string;
  meetingId: string;
  kind: "SONCAS" | "DISC";
  model: string;
  result: unknown;
  createdAt: Date;
}): MeetingAnalysisRow {
  return {
    id: row.id,
    meetingId: row.meetingId,
    kind: row.kind,
    model: row.model,
    result: row.result,
    createdAt: row.createdAt,
  };
}

export class PrismaMeetingRepository implements MeetingRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async createMeeting(input: {
    clerkOrgId: string;
    sellerUserId: string;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
  }): Promise<MeetingRow> {
    const row = await this.db.meeting.create({
      data: {
        clerkOrgId: input.clerkOrgId,
        sellerUserId: input.sellerUserId,
        prospectName: input.prospectName,
        meetingAt: input.meetingAt,
        durationMin: input.durationMin,
        transcript: input.transcript,
        notes: input.notes,
        outcome: input.outcome,
      },
    });
    return mapMeeting(row);
  }

  async findMeetingByIdForOrg(input: {
    id: string;
    clerkOrgId: string;
  }): Promise<MeetingRow | null> {
    const row = await this.db.meeting.findFirst({
      where: { id: input.id, clerkOrgId: input.clerkOrgId },
    });
    return row ? mapMeeting(row) : null;
  }

  async listMeetingsForOrg(input: {
    clerkOrgId: string;
    limit?: number;
  }): Promise<MeetingRow[]> {
    const rows = await this.db.meeting.findMany({
      where: { clerkOrgId: input.clerkOrgId },
      orderBy: { meetingAt: "desc" },
      take: input.limit ?? 100,
    });
    return rows.map(mapMeeting);
  }

  async createAnalysis(input: {
    meetingId: string;
    kind: "SONCAS" | "DISC";
    promptVersionId: string;
    model: string;
    result: unknown;
    rawText?: string | null;
  }): Promise<MeetingAnalysisRow> {
    const row = await this.db.meetingAnalysis.create({
      data: {
        meetingId: input.meetingId,
        kind: input.kind,
        promptVersionId: input.promptVersionId,
        model: input.model,
        result: input.result as object,
        rawText: input.rawText ?? null,
      },
    });
    return mapAnalysis(row);
  }

  async findLatestAnalysisForMeeting(input: {
    meetingId: string;
    kind: "SONCAS" | "DISC";
  }): Promise<MeetingAnalysisRow | null> {
    const row = await this.db.meetingAnalysis.findFirst({
      where: { meetingId: input.meetingId, kind: input.kind },
      orderBy: { createdAt: "desc" },
    });
    return row ? mapAnalysis(row) : null;
  }

  async countMeetingsWithMeetingAtSince(input: {
    clerkOrgId: string;
    since: Date;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.since },
      },
    });
  }

  async countMeetingsWithMeetingAtSinceAndOutcome(input: {
    clerkOrgId: string;
    since: Date;
    outcome: MeetingOutcome;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.since },
        outcome: input.outcome,
      },
    });
  }

  async listAnalysesForOrgMeetingsSince(input: {
    clerkOrgId: string;
    meetingAtSince: Date;
    kinds: Array<"SONCAS" | "DISC">;
  }): Promise<MeetingAnalysisRow[]> {
    const rows = await this.db.meetingAnalysis.findMany({
      where: {
        kind: { in: input.kinds },
        meeting: {
          clerkOrgId: input.clerkOrgId,
          meetingAt: { gte: input.meetingAtSince },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        meetingId: true,
        kind: true,
        model: true,
        result: true,
        createdAt: true,
      },
    });
    return rows.map(mapAnalysis);
  }
}
