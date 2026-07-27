import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type {
  MeetingSourceType,
  MeetingStatus,
} from "@/src/core/domain/meeting-status";

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
  /** Nom affiché du contact lié (fiche Person). */
  personDisplayName: string;
  /** Société du contact lié, si renseignée. */
  prospectCompany: string | null;
  sellerEmail: string | null;
  sellerFirstName: string | null;
  sellerLastName: string | null;
  hasSoncas: boolean;
  hasDisc: boolean;
  hasKiss: boolean;
  /** Moyenne des scores SONCAS (6 leviers), si analyse présente. */
  salesScore: number | null;
  /** Dernier résultat SONCAS brut (agrégations admin / radar équipe). */
  latestSoncasResult?: unknown | null;
  /** Dernier résultat DISC brut (répartition admin). */
  latestDiscResult?: unknown | null;
  /** Dernier résultat KISS brut (agrégations coaching équipe). */
  latestKissResult?: unknown | null;
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
  personId: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: Date;
  outcome: MeetingOutcome;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  feeling: number | null;
  status: MeetingStatus;
  errorMessage: string | null;
  followUpEmailDraft: string | null;
  visitReportDraft: string | null;
  transcript: string;
  notes: string | null;
  updatedAt: Date;
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
    feeling?: number | null;
    sourceType?: MeetingSourceType;
    sourceBlobUrl?: string | null;
    status?: MeetingStatus;
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
    /**
     * Périmètre de comptage : ces commerciaux, ou toute l'organisation.
     *
     * Une liste absente ou vide veut dire « pas de cadrage », donc « tout »,
     * jamais « rien » : c'est la convention de `lib/team-seller-scope.ts`, et
     * les appelants la partagent avec les écrans qu'ils alimentent.
     *
     * Une liste plutôt qu'un seul identifiant parce que le sélecteur de période
     * annonce la disponibilité d'un écran : sur un écran d'équipe, il doit donc
     * compter l'équipe, et non son manager seul ni l'organisation entière.
     */
    sellerUserIds?: string[];
  }): Promise<number>;

  countMeetingsForOrg(input: { organizationId: string }): Promise<number>;

  listRecentMeetingsForDashboard(input: {
    organizationId: string;
    limit?: number;
    /** Si défini : RDV dont la date de rendez-vous est >= ce jour (fenêtre KPI). */
    meetingAtSince?: Date;
    /** Borne haute exclusive sur `meetingAt` (fenêtre précédente). */
    meetingAtBefore?: Date;
    /** Inclut `latestSoncasResult` pour agrégations (radar SONCAS équipe). */
    includeLatestSoncasResult?: boolean;
    /** Inclut `latestDiscResult` (camembert DISC équipe). */
    includeLatestDiscResult?: boolean;
    /** Inclut `latestKissResult` (coaching KISS agrégé). */
    includeLatestKissResult?: boolean;
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

  updateMeetingVisitReportDraft(input: {
    id: string;
    organizationId: string;
    visitReportDraft: string | null;
  }): Promise<boolean>;

  updateMeeting(input: {
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
  }): Promise<boolean>;

  updateMeetingStatus(input: {
    id: string;
    organizationId: string;
    status: MeetingStatus;
    errorMessage?: string | null;
  }): Promise<boolean>;

  updatePersonProfileCache(input: {
    personId: string;
    organizationId: string;
    discDominant?: string | null;
    soncasDominant?: string | null;
  }): Promise<void>;

  searchMeetingsForOrg(input: {
    organizationId: string;
    query: string;
    sellerUserId?: string;
    limit?: number;
  }): Promise<MeetingRow[]>;

  listMeetingsForPersonOrdered(input: {
    organizationId: string;
    personId: string;
    limit?: number;
  }): Promise<MeetingRow[]>;

  countByAnalysisStatus(): Promise<{ ready: number; failed: number }>;
}
