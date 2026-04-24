import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

/** Analysis kinds persisted on \`MeetingAnalysis\`. */
export type MeetingAnalysisKind = "SONCAS" | "DISC" | "KISS";

export type MeetingRow = {
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
  transcript: string;
  notes: string | null;
  outcome: MeetingOutcome;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingAnalysisRow = {
  id: string;
  meetingId: string;
  kind: MeetingAnalysisKind;
  model: string;
  result: unknown;
  createdAt: Date;
};

/** Recent meeting row for dashboard (tri par date d’ajout). */
export type RecentMeetingListRow = MeetingRow & {
  sellerEmail: string | null;
  hasSoncas: boolean;
  hasDisc: boolean;
  hasKiss: boolean;
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

/** Meeting detail page: transcript + ordered analyses. */
export type MeetingDetailWithAnalyses = {
  id: string;
  sellerUserId: string;
  prospectName: string;
  meetingAt: Date;
  outcome: MeetingOutcome;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  followUpEmailDraft: string | null;
  transcript: string;
  notes: string | null;
  analyses: Array<{
    kind: MeetingAnalysisKind;
    model: string;
    result: unknown;
  }>;
};

export interface MeetingRepositoryPort {
  createMeeting(input: {
    organizationId: string;
    sellerUserId: string;
    /** When set, must reference an existing Person in the same organization. */
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
  }): Promise<MeetingRow>;

  findMeetingByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<MeetingRow | null>;

  listMeetingsForOrg(input: {
    organizationId: string;
    limit?: number;
  }): Promise<MeetingRow[]>;

  listMeetingsForPersonInOrg(input: {
    organizationId: string;
    personId: string;
  }): Promise<MeetingRow[]>;

  createAnalysis(input: {
    meetingId: string;
    kind: MeetingAnalysisKind;
    promptVersionId: string;
    model: string;
    result: unknown;
    rawText?: string | null;
  }): Promise<MeetingAnalysisRow>;

  findLatestAnalysisForMeeting(input: {
    meetingId: string;
    organizationId: string;
    kind: MeetingAnalysisKind;
  }): Promise<MeetingAnalysisRow | null>;

  countMeetingsWithMeetingAtSince(input: {
    organizationId: string;
    since: Date;
    sellerUserId?: string;
  }): Promise<number>;

  countMeetingsWithMeetingAtSinceAndOutcome(input: {
    organizationId: string;
    since: Date;
    outcome: MeetingOutcome;
    sellerUserId?: string;
  }): Promise<number>;

  listAnalysesForOrgMeetingsSince(input: {
    organizationId: string;
    meetingAtSince: Date;
    kinds: MeetingAnalysisKind[];
    sellerUserId?: string;
  }): Promise<MeetingAnalysisRow[]>;

  countMeetingsForOrg(input: { organizationId: string }): Promise<number>;

  countMeetingsWithMeetingAtBetween(input: {
    organizationId: string;
    meetingAtGte: Date;
    meetingAtLt: Date;
    sellerUserId?: string;
  }): Promise<number>;

  /** Moyenne de `durationMin` (non null) sur la fenêtre [gte, lt) ou [gte, +∞). */
  averageDurationMinForMeetingsInWindow(input: {
    organizationId: string;
    meetingAtGte: Date;
    meetingAtLt?: Date;
    sellerUserId?: string;
  }): Promise<number | null>;

  listRecentMeetingsForDashboard(input: {
    organizationId: string;
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
    organizationId: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<PersonOutreachSummaryRow[]>;

  countMeetingAnalysesForOrganization(organizationId: string): Promise<number>;

  deleteMeetingByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<boolean>;

  findMeetingDetailWithAnalyses(input: {
    id: string;
    organizationId: string;
  }): Promise<MeetingDetailWithAnalyses | null>;

  updateMeetingFollowUpDraft(input: {
    id: string;
    organizationId: string;
    followUpEmailDraft: string | null;
  }): Promise<boolean>;
}
