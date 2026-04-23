import type { MeetingOutcome } from "@/lib/generated/prisma/enums";

export type MeetingRow = {
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
};

export type MeetingAnalysisRow = {
  id: string;
  meetingId: string;
  kind: "SONCAS" | "DISC";
  model: string;
  result: unknown;
  createdAt: Date;
};

/** Recent meeting row for dashboard (tri par date d’ajout). */
export type RecentMeetingListRow = MeetingRow & {
  sellerEmail: string | null;
  hasSoncas: boolean;
  hasDisc: boolean;
  /** Moyenne des scores SONCAS (6 leviers), si analyse présente. */
  salesScore: number | null;
};

export interface MeetingRepositoryPort {
  createMeeting(input: {
    clerkOrgId: string;
    sellerUserId: string;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
  }): Promise<MeetingRow>;

  findMeetingByIdForOrg(input: {
    id: string;
    clerkOrgId: string;
  }): Promise<MeetingRow | null>;

  listMeetingsForOrg(input: {
    clerkOrgId: string;
    limit?: number;
  }): Promise<MeetingRow[]>;

  createAnalysis(input: {
    meetingId: string;
    kind: "SONCAS" | "DISC";
    promptVersionId: string;
    model: string;
    result: unknown;
    rawText?: string | null;
  }): Promise<MeetingAnalysisRow>;

  findLatestAnalysisForMeeting(input: {
    meetingId: string;
    kind: "SONCAS" | "DISC";
  }): Promise<MeetingAnalysisRow | null>;

  countMeetingsWithMeetingAtSince(input: {
    clerkOrgId: string;
    since: Date;
  }): Promise<number>;

  countMeetingsWithMeetingAtSinceAndOutcome(input: {
    clerkOrgId: string;
    since: Date;
    outcome: MeetingOutcome;
  }): Promise<number>;

  listAnalysesForOrgMeetingsSince(input: {
    clerkOrgId: string;
    meetingAtSince: Date;
    kinds: Array<"SONCAS" | "DISC">;
  }): Promise<MeetingAnalysisRow[]>;

  countMeetingsForOrg(input: { clerkOrgId: string }): Promise<number>;

  countMeetingsWithMeetingAtBetween(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt: Date;
  }): Promise<number>;

  /** Moyenne de `durationMin` (non null) sur la fenêtre [gte, lt) ou [gte, +∞). */
  averageDurationMinForMeetingsInWindow(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt?: Date;
  }): Promise<number | null>;

  listRecentMeetingsForDashboard(input: {
    clerkOrgId: string;
    limit?: number;
    /** Si défini : RDV dont la date de rendez-vous est >= ce jour (fenêtre KPI). */
    meetingAtSince?: Date;
    /** Borne haute exclusive sur `meetingAt` (fenêtre précédente). */
    meetingAtBefore?: Date;
  }): Promise<RecentMeetingListRow[]>;
}
