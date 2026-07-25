import { describe, expect, it } from "@jest/globals";
import {
  aggregateTeamSalesProfileFromMeetings,
  salesProfileScoresFromMeeting,
} from "./sales-profile-from-meetings";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

/* Un prospect très typé : c'est exactement ce que le profil ne doit plus lire. */
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

/** Analyse KISS d'avant les six notes : valide, mais muette sur le vendeur. */
const kissSansNotes = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t1", "t2", "t3"],
  goldenQuestion: "gq",
  coachingScore: 7,
  coachingScoreJustification: "j",
  summary: "summary text here",
};

const sellerSkills = {
  assertivite: 60,
  ecouteActive: 70,
  capitalSympathie: 50,
  argumentation: 40,
  objections: 30,
  nextSteps: 20,
};

const kissResult = { ...kissSansNotes, sellerSkills };

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

  it("reads the six dimensions from the KISS seller scores", () => {
    expect(salesProfileScoresFromMeeting(meeting())).toEqual(sellerSkills);
  });

  it("returns null for a KISS analysis produced before the seller scores", () => {
    expect(
      salesProfileScoresFromMeeting(
        meeting({ latestKissResult: kissSansNotes }),
      ),
    ).toBeNull();
  });

  /*
    Le cœur du correctif. Ce RDV porte un prospect fortement typé (sympathie 90,
    stabilité 85) et aucune note sur le commercial. L'ancien calcul en tirait un
    profil de vente flatteur ; le nouveau ne tire rien, parce qu'il n'y a rien
    sur le commercial à en tirer.
  */
  it("ignores prospect-side SONCAS and DISC scores entirely", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting({ latestKissResult: kissSansNotes }),
    ]);
    expect(agg).toEqual({ scores: null, rdvCount: 0 });
  });

  it("averages the seller scores across meetings", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting(),
      meeting({
        id: "m2",
        latestKissResult: {
          ...kissResult,
          sellerSkills: { ...sellerSkills, assertivite: 80, nextSteps: 30 },
        },
      }),
    ]);
    expect(agg.rdvCount).toBe(2);
    expect(agg.scores?.assertivite).toBe(70);
    expect(agg.scores?.nextSteps).toBe(25);
    expect(agg.scores?.ecouteActive).toBe(70);
  });

  it("counts only the meetings that carry seller scores", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting(),
      meeting({ id: "m2", latestKissResult: kissSansNotes }),
      meeting({ id: "m3", latestKissResult: null }),
    ]);
    expect(agg.rdvCount).toBe(1);
    expect(agg.scores).toEqual(sellerSkills);
  });

  it("returns an empty aggregate when no meeting is scored", () => {
    const agg = aggregateTeamSalesProfileFromMeetings([
      meeting({
        latestSoncasResult: null,
        latestDiscResult: null,
        latestKissResult: null,
      }),
    ]);
    expect(agg).toEqual({ scores: null, rdvCount: 0 });
  });
});
