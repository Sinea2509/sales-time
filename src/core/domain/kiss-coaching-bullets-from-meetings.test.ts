import { describe, expect, it } from "@jest/globals";
import { kissCoachingBulletsFromMeetings } from "./kiss-coaching-bullets-from-meetings";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

function meeting(
  kiss: { improve: string[]; start: string[] } | null,
): RecentMeetingListRow {
  return {
    id: "m1",
    organizationId: "org1",
    sellerUserId: "u1",
    personId: "p1",
    prospectName: "Acme",
    personDisplayName: "Acme",
    prospectCompany: null,
    meetingAt: new Date("2026-01-01T00:00:00.000Z"),
    durationMin: 30,
    meetingType: null,
    pipelineStage: null,
    potentialAmount: null,
    followUpEmailDraft: null,
    visitReportDraft: null,
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
    hasSoncas: false,
    hasDisc: false,
    hasKiss: kiss != null,
    salesScore: null,
    latestKissResult:
      kiss == null
        ? null
        : {
            keep: ["k"],
            improve: kiss.improve,
            stop: ["s"],
            start: kiss.start,
            goldenQuestion: "gq",
            coachingScore: 7,
            coachingScoreJustification: "j",
            summary: "summary text here",
          },
  };
}

describe("kissCoachingBulletsFromMeetings", () => {
  it("collects unique improve bullets", () => {
    expect(
      kissCoachingBulletsFromMeetings(
        [
          meeting({ improve: ["A", "B"], start: [] }),
          meeting({ improve: ["B", "C"], start: [] }),
        ],
        "improve",
      ),
    ).toEqual(["A", "B", "C"]);
  });

  it("collects start bullets", () => {
    expect(
      kissCoachingBulletsFromMeetings(
        [meeting({ improve: [], start: ["Lancer un recap"] })],
        "start",
      ),
    ).toEqual(["Lancer un recap"]);
  });

  it("collects keep and stop bullets", () => {
    expect(
      kissCoachingBulletsFromMeetings(
        [meeting({ improve: [], start: [] })],
        "keep",
      ),
    ).toEqual(["k"]);
    expect(
      kissCoachingBulletsFromMeetings(
        [meeting({ improve: [], start: [] })],
        "stop",
      ),
    ).toEqual(["s"]);
  });
});
