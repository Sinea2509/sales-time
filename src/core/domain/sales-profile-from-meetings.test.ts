import { describe, expect, it } from "@jest/globals";
import {
  aggregateTeamSalesProfileFromMeetings,
  salesProfileScoresFromMeeting,
} from "./sales-profile-from-meetings";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

const soncasResult = {
  drivers: {
    securite: { score: 60, evidence: ["e"] },
    orgueil: { score: 70, evidence: ["e"] },
    nouveaute: { score: 50, evidence: ["e"] },
    confort: { score: 80, evidence: ["e"] },
    argent: { score: 65, evidence: ["e"] },
    sympathie: { score: 90, evidence: ["e"] },
  },
  dominant: "sympathie" as const,
  summary: "s",
};

const discResult = {
  scores: { D: 40, I: 70, S: 85, C: 55 },
  dominant: "S" as const,
  evidence: ["e"],
  summary: "s",
};

const kissResult = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t1", "t2", "t3"],
  goldenQuestion: "gq",
  coachingScore: 7,
  coachingScoreJustification: "j",
  summary: "summary text here",
};

function meeting(
  over: Partial<RecentMeetingListRow> = {},
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
    hasSoncas: true,
    hasDisc: true,
    hasKiss: true,
    salesScore: 75,
    latestSoncasResult: soncasResult,
    latestDiscResult: discResult,
    latestKissResult: kissResult,
    ...over,
  };
}

describe("sales-profile-from-meetings", () => {
  it("returns null when no analyses", () => {
    expect(
      salesProfileScoresFromMeeting(
        meeting({
          latestSoncasResult: null,
          latestDiscResult: null,
          latestKissResult: null,
        }),
      ),
    ).toBeNull();
  });

  it("derives six dimensions from analyses", () => {
    const scores = salesProfileScoresFromMeeting(meeting());
    expect(scores?.assertivite).toBeGreaterThan(0);
    expect(scores?.capitalSympathie).toBeGreaterThan(0);
    expect(scores?.nextSteps).toBeGreaterThan(0);
  });

  it("aggregates averages across meetings", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting(),
      meeting({ id: "m2", latestKissResult: { ...kissResult, coachingScore: 5 } }),
    ]);
    expect(agg.rdvCount).toBe(2);
    expect(agg.scores?.assertivite).toBeGreaterThan(0);
  });

  it("returns empty aggregate when meetings lack profile signals", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting({
        latestSoncasResult: null,
        latestDiscResult: null,
        latestKissResult: null,
      }),
    ]);
    expect(agg).toEqual({ scores: null, rdvCount: 0 });
  });

  it("defaults missing dimension values to zero in aggregate", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting({
        latestSoncasResult: null,
        latestKissResult: null,
        latestDiscResult: {
          scores: { D: 55, I: 0, S: 0, C: 0 },
          dominant: "D" as const,
          evidence: ["e"],
          summary: "s",
        },
      }),
    ]);
    expect(agg.scores?.assertivite).toBe(55);
    expect(agg.scores?.nextSteps).toBe(0);
  });
});
