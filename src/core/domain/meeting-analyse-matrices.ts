import { meetingEtapeDisplayLabel } from "./meeting-etape-display";
import { sellerDisplayNameFromMeetingRow } from "./seller-display-name";
import { soncasResultSchema } from "./analysis-result-zod";
import { kissResultSchema } from "./kiss-result-zod";
import type { MeetingOutcome } from "./meeting-outcome";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

export const MATRIX_AXIS_MIN = -3;
export const MATRIX_AXIS_MAX = 3;
export const MATRIX_AXIS_TICKS = [-3, -2, -1, 0, 1, 2, 3] as const;

export type MeetingRdvMatrixPoint = {
  id: string;
  prospectName: string;
  salesScore: number;
  tamMinutes: number;
  /** Libellé « Étape » affiché (type de RDV ou étape pipeline). */
  etape: string;
  outcome: MeetingOutcome;
};

export type QualificationPotentialMatrixPoint = {
  id: string;
  /** Nom du contact (prospect). */
  prospectName: string;
  qualification: number;
  potential: number;
  /** Libellé « Étape » affiché (type de RDV ou étape pipeline). */
  etape: string;
  outcome: MeetingOutcome;
  potentialAmount: number | null;
  salesScore: number | null;
  sellerUserId: string;
  sellerDisplayName: string;
};

function meetingEtapeFromRow(meeting: RecentMeetingListRow): string {
  return meetingEtapeDisplayLabel({
    meetingType: meeting.meetingType,
    pipelineStage: meeting.pipelineStage,
  });
}

/** Mappe un score 0–100 sur l’axe matrice [-3 ; 3]. */
export function linearScoreToMatrixAxis(score0To100: number): number {
  const clamped = Math.min(100, Math.max(0, score0To100));
  const raw =
    (clamped / 100) * (MATRIX_AXIS_MAX - MATRIX_AXIS_MIN) + MATRIX_AXIS_MIN;
  return Math.round(raw * 10) / 10;
}

/** Normalise une valeur numérique parmi ses pairs sur [-3 ; 3]. */
export function normalizePeerValueToMatrixAxis(
  value: number,
  peerValues: number[],
): number {
  if (peerValues.length === 0) return 0;
  const min = Math.min(...peerValues);
  const max = Math.max(...peerValues);
  if (max === min) return 0;
  const t = (value - min) / (max - min);
  const raw = t * (MATRIX_AXIS_MAX - MATRIX_AXIS_MIN) + MATRIX_AXIS_MIN;
  return Math.round(raw * 10) / 10;
}

function qualificationAxisFromMeeting(
  meeting: RecentMeetingListRow,
): number | null {
  if (meeting.salesScore != null) {
    return linearScoreToMatrixAxis(meeting.salesScore);
  }
  if (meeting.latestKissResult != null) {
    const parsed = kissResultSchema.safeParse(meeting.latestKissResult);
    if (parsed.success) {
      return linearScoreToMatrixAxis((parsed.data.coachingScore / 10) * 100);
    }
  }
  return null;
}

function potentialAxisFromMeeting(
  meeting: RecentMeetingListRow,
  peerPotentialAmounts: number[],
): number | null {
  if (
    meeting.potentialAmount != null &&
    meeting.potentialAmount > 0 &&
    peerPotentialAmounts.length > 0
  ) {
    return normalizePeerValueToMatrixAxis(
      meeting.potentialAmount,
      peerPotentialAmounts,
    );
  }
  if (meeting.latestSoncasResult != null) {
    const parsed = soncasResultSchema.safeParse(meeting.latestSoncasResult);
    if (parsed.success) {
      return linearScoreToMatrixAxis(parsed.data.drivers.argent.score);
    }
  }
  return null;
}

export function buildMeetingRdvMatrixPoints(
  meetings: RecentMeetingListRow[],
): MeetingRdvMatrixPoint[] {
  return meetings.flatMap((m) => {
    if (m.salesScore == null) return [];
    if (m.durationMin == null || m.durationMin <= 0) return [];
    return [
      {
        id: m.id,
        prospectName: m.prospectName,
        salesScore: m.salesScore,
        tamMinutes: m.durationMin,
        etape: meetingEtapeFromRow(m),
        outcome: m.outcome,
      },
    ];
  });
}

export function buildQualificationPotentialMatrixPoints(
  meetings: RecentMeetingListRow[],
): QualificationPotentialMatrixPoint[] {
  const peerPotentialAmounts = meetings
    .map((m) => m.potentialAmount)
    .filter((a): a is number => a != null && a > 0);

  return meetings.flatMap((m) => {
    const qualification = qualificationAxisFromMeeting(m);
    const potential = potentialAxisFromMeeting(m, peerPotentialAmounts);
    if (qualification == null || potential == null) return [];
    return [
      {
        id: m.id,
        prospectName: m.prospectName,
        qualification,
        potential,
        etape: meetingEtapeFromRow(m),
        outcome: m.outcome,
        potentialAmount: m.potentialAmount,
        salesScore: m.salesScore,
        sellerUserId: m.sellerUserId,
        sellerDisplayName: sellerDisplayNameFromMeetingRow(m),
      },
    ];
  });
}
