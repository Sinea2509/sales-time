import { describe, expect, it } from "@jest/globals";
import { meetingEtapeDisplayLabel } from "./meeting-etape-display";
import {
  buildMeetingRdvMatrixPoints,
  buildQualificationPotentialMatrixPoints,
  linearScoreToMatrixAxis,
  normalizePeerValueToMatrixAxis,
} from "./meeting-analyse-matrices";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

function meeting(
  over: Partial<RecentMeetingListRow> = {},
): RecentMeetingListRow {
  return {
    id: "m1",
    organizationId: "org1",
    sellerUserId: "u1",
    personId: "p1",
    prospectName: "Acme",
    prospectCompany: null,
    meetingAt: new Date("2026-01-01T00:00:00.000Z"),
    durationMin: 30,
    meetingType: null,
    pipelineStage: null,
    potentialAmount: 50_000,
    followUpEmailDraft: null,
    transcript: "",
    notes: null,
    outcome: "FOLLOW_UP",
    feeling: null,
    status: "READY",
    errorMessage: null,
    sourceType: "TRANSCRIPT",
    sourceBlobUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    sellerEmail: "a@b.co",
    sellerFirstName: null,
    sellerLastName: null,
    hasSoncas: true,
    hasDisc: false,
    hasKiss: false,
    salesScore: 80,
    ...over,
  };
}

describe("meeting-analyse-matrices", () => {
  it("linearScoreToMatrixAxis maps 0 and 100 to -3 and 3", () => {
    expect(linearScoreToMatrixAxis(0)).toBe(-3);
    expect(linearScoreToMatrixAxis(100)).toBe(3);
    expect(linearScoreToMatrixAxis(50)).toBe(0);
  });

  it("normalizePeerValueToMatrixAxis spreads peer values", () => {
    expect(normalizePeerValueToMatrixAxis(10, [10, 20])).toBe(-3);
    expect(normalizePeerValueToMatrixAxis(20, [10, 20])).toBe(3);
  });

  it("buildMeetingRdvMatrixPoints requires score and connected duration", () => {
    expect(buildMeetingRdvMatrixPoints([meeting()])).toHaveLength(1);
    expect(
      buildMeetingRdvMatrixPoints([meeting({ salesScore: null })]),
    ).toHaveLength(0);
    expect(
      buildMeetingRdvMatrixPoints([meeting({ durationMin: 0 })]),
    ).toHaveLength(0);
  });

  it("buildQualificationPotentialMatrixPoints uses amount and sales score", () => {
    const points = buildQualificationPotentialMatrixPoints([
      meeting({ potentialAmount: 10_000, meetingType: "Proposition" }),
      meeting({ id: "m2", potentialAmount: 30_000, salesScore: 60 }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]?.etape).toBe("Proposition");
    expect(points[0]?.qualification).toBeGreaterThan(-3.1);
    expect(points[0]?.potential).toBeGreaterThanOrEqual(-3);
  });

  it("buildMeetingRdvMatrixPoints includes étape from meeting fields", () => {
    const points = buildMeetingRdvMatrixPoints([
      meeting({ meetingType: "Closing", pipelineStage: "Gagné" }),
    ]);
    expect(points[0]?.etape).toBe("Closing");
    expect(meetingEtapeDisplayLabel({ meetingType: null, pipelineStage: "Gagné" })).toBe(
      "Gagné",
    );
  });
});
