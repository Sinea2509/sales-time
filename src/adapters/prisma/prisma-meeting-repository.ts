import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type {
  MeetingSourceType,
  MeetingStatus,
} from "@/src/core/domain/meeting-status";
import { salesScoreFromSoncasResult } from "@/src/core/domain/dashboard-sales-score";
import { normalizePersonDisplayKey } from "@/src/core/domain/person-normalize";
import { outreachPriorityScore } from "@/src/core/domain/person-outreach-priority";
import type {
  MeetingAnalysisKind,
  MeetingAnalysisRow,
  MeetingDetailWithAnalyses,
  MeetingRepositoryPort,
  MeetingRow,
  PersonOutreachSummaryRow,
  RecentMeetingListRow,
} from "@/src/core/ports/meeting-repository-port";

function mapMeeting(row: {
  id: string;
  organizationId: string;
  sellerUserId: string;
  personId: string;
  prospectName: string;
  meetingAt: Date;
  durationMin: number | null;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  followUpEmailDraft: string | null;
  visitReportDraft: string | null;
  transcript: string;
  notes: string | null;
  outcome: MeetingOutcome;
  feeling: number | null;
  status: MeetingStatus;
  errorMessage: string | null;
  sourceType: MeetingSourceType;
  sourceBlobUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MeetingRow {
  return {
    id: row.id,
    organizationId: row.organizationId,
    sellerUserId: row.sellerUserId,
    personId: row.personId,
    prospectName: row.prospectName,
    meetingAt: row.meetingAt,
    durationMin: row.durationMin,
    meetingType: row.meetingType,
    pipelineStage: row.pipelineStage,
    potentialAmount: row.potentialAmount,
    followUpEmailDraft: row.followUpEmailDraft,
    visitReportDraft: row.visitReportDraft,
    transcript: row.transcript,
    notes: row.notes,
    outcome: row.outcome,
    feeling: row.feeling,
    status: row.status,
    errorMessage: row.errorMessage,
    sourceType: row.sourceType,
    sourceBlobUrl: row.sourceBlobUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAnalysis(row: {
  id: string;
  meetingId: string;
  kind: string;
  model: string;
  result: unknown;
  createdAt: Date;
}): MeetingAnalysisRow {
  return {
    id: row.id,
    meetingId: row.meetingId,
    kind: row.kind as MeetingAnalysisKind,
    model: row.model,
    result: row.result,
    createdAt: row.createdAt,
  };
}

function sellerWhere(sellerUserId?: string) {
  return sellerUserId != null ? { sellerUserId } : {};
}

/**
 * Le même filtre, pour plusieurs commerciaux : l'équipe d'un manager.
 *
 * Une liste absente ou vide ne pose aucune condition, c'est-à-dire compte
 * l'organisation entière. Écrire `{ in: [] }` dirait l'inverse et ne rendrait
 * jamais rien ; c'est la convention de `lib/team-seller-scope.ts`, tenue ici
 * jusque dans la requête.
 */
function sellersWhere(sellerUserIds?: string[]) {
  return sellerUserIds?.length ? { sellerUserId: { in: sellerUserIds } } : {};
}

export class PrismaMeetingRepository implements MeetingRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async createMeeting(input: {
    organizationId: string;
    sellerUserId: string;
    personId?: string | null;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    meetingType: string | null;
    pipelineStage: string | null;
    potentialAmount: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
    feeling?: number | null;
    sourceType?: MeetingSourceType;
    sourceBlobUrl?: string | null;
    status?: MeetingStatus;
  }): Promise<MeetingRow> {
    let personId: string;
    let prospectDisplay: string;

    if (input.personId) {
      const linked = await this.db.person.findFirst({
        where: {
          id: input.personId,
          organizationId: input.organizationId,
        },
      });
      if (!linked) {
        throw new Error("MEETING_CREATE_INVALID_PERSON");
      }
      personId = linked.id;
      prospectDisplay = linked.displayName;
    } else {
      const displayName = input.prospectName.trim();
      const normalizedKey = normalizePersonDisplayKey(displayName);
      const person = await this.db.person.upsert({
        where: {
          organizationId_normalizedKey: {
            organizationId: input.organizationId,
            normalizedKey,
          },
        },
        create: {
          organizationId: input.organizationId,
          displayName,
          normalizedKey,
        },
        update: { displayName },
      });
      personId = person.id;
      prospectDisplay = displayName;
    }

    const row = await this.db.meeting.create({
      data: {
        organizationId: input.organizationId,
        sellerUserId: input.sellerUserId,
        personId,
        prospectName: prospectDisplay,
        meetingAt: input.meetingAt,
        durationMin: input.durationMin,
        meetingType: input.meetingType,
        pipelineStage: input.pipelineStage,
        potentialAmount: input.potentialAmount,
        followUpEmailDraft: null,
        visitReportDraft: null,
        transcript: input.transcript,
        notes: input.notes,
        outcome: input.outcome,
        feeling: input.feeling ?? null,
        sourceType: input.sourceType ?? "TRANSCRIPT",
        sourceBlobUrl: input.sourceBlobUrl ?? null,
        status: input.status ?? "PENDING",
      },
    });
    return mapMeeting(row);
  }

  async findMeetingByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<MeetingRow | null> {
    const row = await this.db.meeting.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    return row ? mapMeeting(row) : null;
  }

  async listMeetingsForOrg(input: {
    organizationId: string;
    limit?: number;
  }): Promise<MeetingRow[]> {
    const rows = await this.db.meeting.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { meetingAt: "desc" },
      take: input.limit ?? 100,
    });
    return rows.map(mapMeeting);
  }

  async listMeetingsForPersonInOrg(input: {
    organizationId: string;
    personId: string;
  }): Promise<MeetingRow[]> {
    const rows = await this.db.meeting.findMany({
      where: {
        organizationId: input.organizationId,
        personId: input.personId,
      },
      orderBy: { meetingAt: "desc" },
    });
    return rows.map(mapMeeting);
  }

  async createAnalysis(input: {
    meetingId: string;
    kind: MeetingAnalysisKind;
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
    organizationId: string;
    kind: MeetingAnalysisKind;
  }): Promise<MeetingAnalysisRow | null> {
    const row = await this.db.meetingAnalysis.findFirst({
      where: {
        meetingId: input.meetingId,
        kind: input.kind,
        meeting: { organizationId: input.organizationId },
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? mapAnalysis(row) : null;
  }

  async countMeetingsWithMeetingAtSince(input: {
    organizationId: string;
    since: Date;
    sellerUserIds?: string[];
  }): Promise<number> {
    return this.db.meeting.count({
      where: {
        organizationId: input.organizationId,
        meetingAt: { gte: input.since },
        ...sellersWhere(input.sellerUserIds),
      },
    });
  }

  async countMeetingsForOrg(input: {
    organizationId: string;
  }): Promise<number> {
    return this.db.meeting.count({
      where: { organizationId: input.organizationId },
    });
  }

  async listRecentMeetingsForDashboard(input: {
    organizationId: string;
    limit?: number;
    meetingAtSince?: Date;
    meetingAtBefore?: Date;
    includeLatestSoncasResult?: boolean;
    includeLatestDiscResult?: boolean;
    includeLatestKissResult?: boolean;
    sellerUserId?: string;
  }): Promise<RecentMeetingListRow[]> {
    const rows = await this.db.meeting.findMany({
      where: {
        organizationId: input.organizationId,
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
        person: { select: { displayName: true, company: true } },
        seller: { select: { email: true, firstName: true, lastName: true } },
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
      const disc = row.analyses.find((a) => a.kind === "DISC");
      const kiss = row.analyses.find((a) => a.kind === "KISS");
      const base = mapMeeting(row);
      const out: RecentMeetingListRow = {
        ...base,
        personDisplayName: row.person.displayName,
        prospectCompany: row.person.company,
        sellerEmail: row.seller.email,
        sellerFirstName: row.seller.firstName,
        sellerLastName: row.seller.lastName,
        hasSoncas: kinds.has("SONCAS"),
        hasDisc: kinds.has("DISC"),
        hasKiss: kinds.has("KISS"),
        salesScore: soncas ? salesScoreFromSoncasResult(soncas.result) : null,
      };
      if (input.includeLatestSoncasResult === true) {
        out.latestSoncasResult = soncas?.result ?? null;
      }
      if (input.includeLatestDiscResult === true) {
        out.latestDiscResult = disc?.result ?? null;
      }
      if (input.includeLatestKissResult === true) {
        out.latestKissResult = kiss?.result ?? null;
      }
      return out;
    });
  }

  async listPersonOutreachSummaries(input: {
    organizationId: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<PersonOutreachSummaryRow[]> {
    const take = Math.min(input.limit ?? 12, 50);
    const grouped = await this.db.meeting.groupBy({
      by: ["personId"],
      where: {
        organizationId: input.organizationId,
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
        organizationId: input.organizationId,
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
      const avgDurationMin = avgRaw == null ? null : Math.round(Number(avgRaw));
      return {
        personId: g.personId,
        displayName: nameById.get(g.personId) ?? "Contact sans nom",
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

  async countMeetingAnalysesForOrganization(
    organizationId: string,
  ): Promise<number> {
    return this.db.meetingAnalysis.count({
      where: { meeting: { organizationId } },
    });
  }

  async deleteMeetingByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const res = await this.db.meeting.deleteMany({
      where: { id: input.id, organizationId: input.organizationId },
    });
    return res.count > 0;
  }

  async findMeetingDetailWithAnalyses(input: {
    id: string;
    organizationId: string;
  }): Promise<MeetingDetailWithAnalyses | null> {
    const row = await this.db.meeting.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      include: {
        analyses: { orderBy: { createdAt: "desc" } },
        person: { select: { company: true } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      sellerUserId: row.sellerUserId,
      personId: row.personId,
      prospectName: row.prospectName,
      prospectCompany: row.person.company,
      meetingAt: row.meetingAt,
      outcome: row.outcome,
      meetingType: row.meetingType,
      pipelineStage: row.pipelineStage,
      potentialAmount: row.potentialAmount,
      feeling: row.feeling,
      status: row.status,
      errorMessage: row.errorMessage,
      followUpEmailDraft: row.followUpEmailDraft,
      visitReportDraft: row.visitReportDraft,
      transcript: row.transcript,
      notes: row.notes,
      updatedAt: row.updatedAt,
      analyses: row.analyses.map((a) => ({
        kind: a.kind as MeetingAnalysisKind,
        model: a.model,
        result: a.result,
        createdAt: a.createdAt,
      })),
    };
  }

  async updateMeetingFollowUpDraft(input: {
    id: string;
    organizationId: string;
    followUpEmailDraft: string | null;
  }): Promise<boolean> {
    const res = await this.db.meeting.updateMany({
      where: { id: input.id, organizationId: input.organizationId },
      data: { followUpEmailDraft: input.followUpEmailDraft },
    });
    return res.count > 0;
  }

  async updateMeetingVisitReportDraft(input: {
    id: string;
    organizationId: string;
    visitReportDraft: string | null;
  }): Promise<boolean> {
    const res = await this.db.meeting.updateMany({
      where: { id: input.id, organizationId: input.organizationId },
      data: { visitReportDraft: input.visitReportDraft },
    });
    return res.count > 0;
  }

  async updateMeeting(input: {
    id: string;
    organizationId: string;
    personId?: string | null;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    meetingType: string | null;
    pipelineStage: string | null;
    potentialAmount: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
    feeling?: number | null;
    sourceType?: MeetingSourceType;
    sourceBlobUrl?: string | null;
  }): Promise<boolean> {
    let personId: string;
    let prospectDisplay: string;

    if (input.personId) {
      const linked = await this.db.person.findFirst({
        where: {
          id: input.personId,
          organizationId: input.organizationId,
        },
      });
      if (!linked) {
        throw new Error("MEETING_UPDATE_INVALID_PERSON");
      }
      personId = linked.id;
      prospectDisplay = linked.displayName;
    } else {
      const displayName = input.prospectName.trim();
      const normalizedKey = normalizePersonDisplayKey(displayName);
      const person = await this.db.person.upsert({
        where: {
          organizationId_normalizedKey: {
            organizationId: input.organizationId,
            normalizedKey,
          },
        },
        create: {
          organizationId: input.organizationId,
          displayName,
          normalizedKey,
        },
        update: { displayName },
      });
      personId = person.id;
      prospectDisplay = displayName;
    }

    const data: {
      personId: string;
      prospectName: string;
      meetingAt: Date;
      durationMin: number | null;
      meetingType: string | null;
      pipelineStage: string | null;
      potentialAmount: number | null;
      transcript: string;
      notes: string | null;
      outcome: MeetingOutcome;
      feeling: number | null;
      sourceType?: MeetingSourceType;
      sourceBlobUrl?: string | null;
    } = {
      personId,
      prospectName: prospectDisplay,
      meetingAt: input.meetingAt,
      durationMin: input.durationMin,
      meetingType: input.meetingType,
      pipelineStage: input.pipelineStage,
      potentialAmount: input.potentialAmount,
      transcript: input.transcript,
      notes: input.notes,
      outcome: input.outcome,
      feeling: input.feeling ?? null,
    };

    if (input.sourceType != null) {
      data.sourceType = input.sourceType;
    }
    if (input.sourceBlobUrl !== undefined) {
      data.sourceBlobUrl = input.sourceBlobUrl;
    }

    const res = await this.db.meeting.updateMany({
      where: { id: input.id, organizationId: input.organizationId },
      data,
    });
    return res.count > 0;
  }

  async updateMeetingStatus(input: {
    id: string;
    organizationId: string;
    status: MeetingStatus;
    errorMessage?: string | null;
  }): Promise<boolean> {
    const res = await this.db.meeting.updateMany({
      where: { id: input.id, organizationId: input.organizationId },
      data: {
        status: input.status,
        errorMessage: input.errorMessage ?? null,
      },
    });
    return res.count > 0;
  }

  async updatePersonProfileCache(input: {
    personId: string;
    organizationId: string;
    discDominant?: string | null;
    soncasDominant?: string | null;
  }): Promise<void> {
    await this.db.person.updateMany({
      where: {
        id: input.personId,
        organizationId: input.organizationId,
      },
      data: {
        ...(input.discDominant !== undefined
          ? { discDominant: input.discDominant }
          : {}),
        ...(input.soncasDominant !== undefined
          ? { soncasDominant: input.soncasDominant }
          : {}),
      },
    });
  }

  async searchMeetingsForOrg(input: {
    organizationId: string;
    query: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<MeetingRow[]> {
    const q = input.query.trim();
    if (!q) return [];
    const rows = await this.db.meeting.findMany({
      where: {
        organizationId: input.organizationId,
        ...sellerWhere(input.sellerUserId),
        OR: [
          { prospectName: { contains: q, mode: "insensitive" } },
          { transcript: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { meetingAt: "desc" },
      take: input.limit ?? 20,
    });
    return rows.map(mapMeeting);
  }

  async listMeetingsForPersonOrdered(input: {
    organizationId: string;
    personId: string;
    limit?: number;
  }): Promise<MeetingRow[]> {
    const rows = await this.db.meeting.findMany({
      where: {
        organizationId: input.organizationId,
        personId: input.personId,
      },
      orderBy: { meetingAt: "desc" },
      take: input.limit ?? 10,
    });
    return rows.map(mapMeeting);
  }

  async countByAnalysisStatus(): Promise<{ ready: number; failed: number }> {
    const [ready, failed] = await Promise.all([
      this.db.meeting.count({ where: { status: "READY" } }),
      this.db.meeting.count({ where: { status: "FAILED" } }),
    ]);
    return { ready, failed };
  }
}
