import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";
import { salesScoreFromSoncasResult } from "@/lib/dashboard-sales-score";
import { normalizePersonDisplayKey } from "@/lib/person-normalize";
import { outreachPriorityScore } from "@/lib/person-outreach-priority";
import type {
  MeetingAnalysisRow,
  MeetingRepositoryPort,
  MeetingRow,
  PersonOutreachSummaryRow,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";

function mapMeeting(row: {
  id: string;
  clerkOrgId: string;
  sellerUserId: string;
  personId: string;
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
    personId: row.personId,
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

function sellerWhere(sellerUserId?: string) {
  return sellerUserId != null ? { sellerUserId } : {};
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
    const displayName = input.prospectName.trim();
    const normalizedKey = normalizePersonDisplayKey(displayName);
    const person = await this.db.person.upsert({
      where: {
        clerkOrgId_normalizedKey: {
          clerkOrgId: input.clerkOrgId,
          normalizedKey,
        },
      },
      create: {
        clerkOrgId: input.clerkOrgId,
        displayName,
        normalizedKey,
      },
      update: { displayName },
    });

    const row = await this.db.meeting.create({
      data: {
        clerkOrgId: input.clerkOrgId,
        sellerUserId: input.sellerUserId,
        personId: person.id,
        prospectName: displayName,
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
    sellerUserId?: string;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.since },
        ...sellerWhere(input.sellerUserId),
      },
    });
  }

  async countMeetingsWithMeetingAtSinceAndOutcome(input: {
    clerkOrgId: string;
    since: Date;
    outcome: MeetingOutcome;
    sellerUserId?: string;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.since },
        outcome: input.outcome,
        ...sellerWhere(input.sellerUserId),
      },
    });
  }

  async listAnalysesForOrgMeetingsSince(input: {
    clerkOrgId: string;
    meetingAtSince: Date;
    kinds: Array<"SONCAS" | "DISC">;
    sellerUserId?: string;
  }): Promise<MeetingAnalysisRow[]> {
    const rows = await this.db.meetingAnalysis.findMany({
      where: {
        kind: { in: input.kinds },
        meeting: {
          clerkOrgId: input.clerkOrgId,
          meetingAt: { gte: input.meetingAtSince },
          ...sellerWhere(input.sellerUserId),
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
    sellerUserId?: string;
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: { gte: input.meetingAtGte, lt: input.meetingAtLt },
        ...sellerWhere(input.sellerUserId),
      },
    });
  }

  async averageDurationMinForMeetingsInWindow(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt?: Date;
    sellerUserId?: string;
  }): Promise<number | null> {
    const row = await this.db.meeting.aggregate({
      where: {
        clerkOrgId: input.clerkOrgId,
        meetingAt: {
          gte: input.meetingAtGte,
          ...(input.meetingAtLt != null ? { lt: input.meetingAtLt } : {}),
        },
        durationMin: { not: null },
        ...sellerWhere(input.sellerUserId),
      },
      _avg: { durationMin: true },
    });
    if (row._avg.durationMin == null) return null;
    return Math.round(Number(row._avg.durationMin));
  }

  async listRecentMeetingsForDashboard(input: {
    clerkOrgId: string;
    limit?: number;
    meetingAtSince?: Date;
    meetingAtBefore?: Date;
    includeLatestSoncasResult?: boolean;
    sellerUserId?: string;
  }): Promise<RecentMeetingListRow[]> {
    const rows = await this.db.meeting.findMany({
      where: {
        clerkOrgId: input.clerkOrgId,
        ...sellerWhere(input.sellerUserId),
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
      ...(input.limit != null ? { take: input.limit } : {}),
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
      const out: RecentMeetingListRow = {
        ...base,
        sellerEmail: row.seller.email,
        hasSoncas: kinds.has("SONCAS"),
        hasDisc: kinds.has("DISC"),
        salesScore: soncas
          ? salesScoreFromSoncasResult(soncas.result)
          : null,
      };
      if (input.includeLatestSoncasResult === true) {
        out.latestSoncasResult = soncas?.result ?? null;
      }
      return out;
    });
  }

  async listPersonOutreachSummaries(input: {
    clerkOrgId: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<PersonOutreachSummaryRow[]> {
    const take = Math.min(input.limit ?? 12, 50);
    const grouped = await this.db.meeting.groupBy({
      by: ["personId"],
      where: {
        clerkOrgId: input.clerkOrgId,
        ...sellerWhere(input.sellerUserId),
      },
      _count: { _all: true },
      _max: { meetingAt: true },
      _avg: { durationMin: true },
    });

    if (grouped.length === 0) return [];

    const personIds = grouped.map((g) => g.personId);
    const persons = await this.db.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, displayName: true },
    });
    const nameById = new Map(persons.map((p) => [p.id, p.displayName]));

    const latestRows = await this.db.meeting.findMany({
      where: {
        clerkOrgId: input.clerkOrgId,
        personId: { in: personIds },
        ...sellerWhere(input.sellerUserId),
      },
      orderBy: { meetingAt: "desc" },
      select: { personId: true, meetingAt: true, outcome: true },
    });
    const latestByPerson = new Map<
      string,
      { meetingAt: Date; outcome: MeetingOutcome }
    >();
    for (const r of latestRows) {
      if (!latestByPerson.has(r.personId)) {
        latestByPerson.set(r.personId, {
          meetingAt: r.meetingAt,
          outcome: r.outcome,
        });
      }
    }

    const rows: PersonOutreachSummaryRow[] = grouped.map((g) => {
      const latest = latestByPerson.get(g.personId)!;
      const meetingCount = g._count._all;
      const avgRaw = g._avg.durationMin;
      const avgDurationMin =
        avgRaw == null ? null : Math.round(Number(avgRaw));
      return {
        personId: g.personId,
        displayName: nameById.get(g.personId) ?? "—",
        meetingCount,
        lastMeetingAt: latest.meetingAt,
        lastOutcome: latest.outcome,
        avgDurationMin,
        outreachPriorityScore: outreachPriorityScore({
          lastMeetingAt: latest.meetingAt,
          meetingCount,
        }),
      };
    });

    rows.sort((a, b) => b.outreachPriorityScore - a.outreachPriorityScore);
    return rows.slice(0, take);
  }
}
