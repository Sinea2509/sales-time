import type { MeetingOutcome } from "@/lib/generated/prisma/enums";

export type MeetingRow = {
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
  /** Dernier résultat SONCAS brut (agrégations admin / radar équipe). */
  latestSoncasResult?: unknown | null;
};

/** Per-person rollup for outreach / Person360 lists. */
export type PersonOutreachSummaryRow = {
  personId: string;
  displayName: string;
  meetingCount: number;
  lastMeetingAt: Date;
  lastOutcome: MeetingOutcome;
  avgDurationMin: number | null;
  outreachPriorityScore: number;
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
    sellerUserId?: string;
  }): Promise<number>;

  countMeetingsWithMeetingAtSinceAndOutcome(input: {
    clerkOrgId: string;
    since: Date;
    outcome: MeetingOutcome;
    sellerUserId?: string;
  }): Promise<number>;

  listAnalysesForOrgMeetingsSince(input: {
    clerkOrgId: string;
    meetingAtSince: Date;
    kinds: Array<"SONCAS" | "DISC">;
    sellerUserId?: string;
  }): Promise<MeetingAnalysisRow[]>;

  countMeetingsForOrg(input: { clerkOrgId: string }): Promise<number>;

  countMeetingsWithMeetingAtBetween(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt: Date;
    sellerUserId?: string;
  }): Promise<number>;

  /** Moyenne de `durationMin` (non null) sur la fenêtre [gte, lt) ou [gte, +∞). */
  averageDurationMinForMeetingsInWindow(input: {
    clerkOrgId: string;
    meetingAtGte: Date;
    meetingAtLt?: Date;
    sellerUserId?: string;
  }): Promise<number | null>;

  listRecentMeetingsForDashboard(input: {
    clerkOrgId: string;
    limit?: number;
    /** Si défini : RDV dont la date de rendez-vous est >= ce jour (fenêtre KPI). */
    meetingAtSince?: Date;
    /** Borne haute exclusive sur `meetingAt` (fenêtre précédente). */
    meetingAtBefore?: Date;
    /** Inclut `latestSoncasResult` pour agrégations (radar SONCAS équipe). */
    includeLatestSoncasResult?: boolean;
    /** Scope to one seller (member role). */
    sellerUserId?: string;
  }): Promise<RecentMeetingListRow[]>;

  listPersonOutreachSummaries(input: {
    clerkOrgId: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<PersonOutreachSummaryRow[]>;
}
