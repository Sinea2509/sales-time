import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";
import { salesScoreFromSoncasResult } from "@/lib/dashboard-sales-score";
import type {
  MeetingAnalysisRow,
  MeetingRepositoryPort,
  MeetingRow,
  RecentMeetingListRow,
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

  async countMeetingsForOrg(input: { clerkOrgId: string }): Promise<number> {
    return this.db.meeting.count({
      where: { clerkOrgId: input.clerkOrgId },
    });
  }

  async countMeetingsWithMeetingAtBetween(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt: Date;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.meetingAtGte, lt: input.meetingAtLt },
      },
    });
  }

  async averageDurationMinForMeetingsInWindow(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt?: Date;
  }): Promise<number | null> {
    const row = await this.db.meeting.aggregate({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: {
          gte: input.meetingAtGte,
          ...(input.meetingAtLt != null ? { lt: input.meetingAtLt } : {}),
        },
        durationMin: { not: null },
      },
      _avg: { durationMin: true },
    });
    if (row._avg.durationMin == null) return null;
    return Math.round(Number(row._avg.durationMin));
  }

  async listRecentMeetingsForDashboard(input: {
    clerkOrgId: string;
    limit: number;
    meetingAtSince?: Date;
    meetingAtBefore?: Date;
  }): Promise<RecentMeetingListRow[]> {
    const rows = await this.db.meeting.findMany({
      where: {
        clerkOrgId: input.clerkOrgId,
        ...(input.meetingAtSince != null || input.meetingAtBefore != null
          ? {
              meetingAt: {
                ...(input.meetingAtSince != null
                  ? { gte: input.meetingAtSince }
                  : {}),
                ...(input.meetingAtBefore != null
                  ? { lt: input.meetingAtBefore }
                  : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: input.limit,
      include: {
        seller: { select: { email: true } },
        analyses: {
          select: { kind: true, result: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 24,
        },
      },
    });

    return rows.map((row) => {
      const kinds = new Set(row.analyses.map((a) => a.kind));
      const soncas = row.analyses.find((a) => a.kind === "SONCAS");
      const base = mapMeeting(row);
      return {
        ...base,
        sellerEmail: row.seller.email,
        hasSoncas: kinds.has("SONCAS"),
        hasDisc: kinds.has("DISC"),
        salesScore: soncas
          ? salesScoreFromSoncasResult(soncas.result)
          : null,
      };
    });
  }
}
