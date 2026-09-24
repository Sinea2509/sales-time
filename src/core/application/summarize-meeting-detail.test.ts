import type { VisitReportExtraction } from "@/src/core/domain/visit-report-zod";
import {
  generateAndPersistMeetingVisitReport,
  summarizeMeetingDetail,
  VISIT_REPORT_TRANSCRIPT_MAX_CHARS,
} from "./summarize-meeting-detail";

jest.mock("@/lib/env", () => ({
  getEnv: jest.fn(() => ({ AI_GATEWAY_API_KEY: undefined })),
}));

const meeting = {
  id: "m1",
  sellerUserId: "u1",
  personId: "p1",
  prospectName: "Antoine Lambert",
  prospectCompany: "TechVision",
  meetingAt: new Date("2026-01-24T10:00:00.000Z"),
  outcome: "FOLLOW_UP" as const,
  meetingType: "Découverte",
  pipelineStage: "Proposition",
  potentialAmount: 50_000,
  feeling: 4,
  status: "READY" as const,
  errorMessage: null,
  followUpEmailDraft: null,
  visitReportDraft: null,
  transcript: "Bonjour, nous parlons budget et sécurité.",
  notes: null,
  updatedAt: new Date(),
  analyses: [],
};

const extraction: VisitReportExtraction = {
  enUnePhrase: "Un premier échange qui pose le besoin sans chiffrer le budget.",
  participants: {
    client: [
      {
        nom: "Antoine Lambert",
        role: "Directeur des achats",
        statut: "présent",
      },
    ],
    nous: [],
    cites: [],
  },
  origine: "",
  themes: [],
  perimetre: { texte: "", citations: [] },
  concurrence: { texte: "", citations: [] },
  objections: [],
  engagements: { texte: "", liste: [], citations: [] },
  prochainRendezVous: {
    quand: "",
    objectif: "",
    participants: "",
    aPreparer: "",
  },
  prochainesEtapes: [],
  interlocutorProfile: "Un acheteur prudent qui veut des garanties.",
};

const prompts = {
  getCurrentVersion: jest.fn().mockResolvedValue(null),
  getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
};

function withAiKey() {
  const { getEnv } = jest.requireMock<{ getEnv: jest.Mock }>("@/lib/env");
  getEnv.mockReturnValue({ AI_GATEWAY_API_KEY: "key" });
}

function meetingsRepository() {
  return {
    updateMeetingVisitReportDraft: jest.fn().mockResolvedValue(true),
    findMeetingByIdForOrg: jest.fn().mockResolvedValue({ durationMin: 45 }),
    listMeetingsForPersonInOrg: jest.fn().mockResolvedValue([
      {
        id: "m0",
        sellerUserId: "u1",
        meetingAt: new Date("2025-12-10T10:00:00.000Z"),
        meetingType: "Découverte",
      },
      {
        id: "m2",
        sellerUserId: "u1",
        meetingAt: new Date("2026-02-01T10:00:00.000Z"),
        meetingType: "Démo",
      },
    ]),
    findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
  };
}

describe("summarizeMeetingDetail", () => {
  afterEach(() => {
    const { getEnv } = jest.requireMock<{ getEnv: jest.Mock }>("@/lib/env");
    getEnv.mockReturnValue({ AI_GATEWAY_API_KEY: undefined });
  });

  it("returns stored visit report when present", async () => {
    const result = await summarizeMeetingDetail(
      {
        analysis: { extractVisitReport: jest.fn() } as never,
        prompts: {} as never,
      },
      {
        meeting: {
          ...meeting,
          visitReportDraft: "Compte-rendu CRM stocké.",
        },
        discResult: null,
        soncasResult: null,
        kissResult: null,
      },
    );
    expect(result.fromAi).toBe(true);
    expect(result.meetingSynthesis).toBe("Compte-rendu CRM stocké.");
  });

  it("returns fallback when AI is not configured", async () => {
    const result = await summarizeMeetingDetail(
      {
        analysis: { extractVisitReport: jest.fn() } as never,
        prompts: {} as never,
      },
      {
        meeting,
        discResult: null,
        soncasResult: null,
        kissResult: {
          summary: "Synthèse coaching.",
          coachingScore: 7,
          coachingScoreJustification: "j",
          goldenQuestion: "q",
          keep: [],
          improve: [],
          stop: [],
          start: [],
        },
      },
    );
    expect(result.fromAi).toBe(false);
    expect(result.meetingSynthesis).toBe("Synthèse coaching.");
  });

  it("shows processing message while analysis runs", async () => {
    const result = await summarizeMeetingDetail(
      {
        analysis: { extractVisitReport: jest.fn() } as never,
        prompts: {} as never,
      },
      {
        meeting: { ...meeting, status: "PROCESSING" },
        discResult: null,
        soncasResult: null,
        kissResult: null,
      },
    );
    expect(result.fromAi).toBe(false);
    expect(result.meetingSynthesis).toContain("en cours de génération");
  });

  it("assembles the visit report from the extraction when the AI key is set", async () => {
    withAiKey();
    const extractVisitReport = jest.fn().mockResolvedValue(extraction);

    const result = await summarizeMeetingDetail(
      { analysis: { extractVisitReport } as never, prompts: prompts as never },
      { meeting, discResult: null, soncasResult: null, kissResult: null },
    );

    expect(result.fromAi).toBe(true);
    expect(
      result.meetingSynthesis.startsWith(
        "COMPTE RENDU DE VISITE\nTechVision · 24 janvier 2026 · Découverte",
      ),
    ).toBe(true);
    expect(result.meetingSynthesis).toContain(
      "EN UNE PHRASE\nUn premier échange qui pose le besoin sans chiffrer le budget.",
    );
    expect(result.interlocutorProfile).toBe(
      "Un acheteur prudent qui veut des garanties.",
    );
  });

  it("sends the transcript within the length limit, with the profiles to adapt to", async () => {
    withAiKey();
    const extractVisitReport = jest.fn().mockResolvedValue(extraction);
    const long = "a".repeat(VISIT_REPORT_TRANSCRIPT_MAX_CHARS + 500);

    await summarizeMeetingDetail(
      { analysis: { extractVisitReport } as never, prompts: prompts as never },
      {
        meeting: { ...meeting, transcript: long },
        discResult: {
          scores: { D: 10, I: 10, S: 60, C: 20 },
          dominant: "S",
          evidence: [],
          summary: "Un interlocuteur posé.",
        },
        soncasResult: null,
        kissResult: null,
      },
    );

    const call = extractVisitReport.mock.calls[0][0];
    expect(call.transcript).toHaveLength(VISIT_REPORT_TRANSCRIPT_MAX_CHARS);
    expect(call.discSummary).toBe("Un interlocuteur posé.");
    expect(call.soncasSummary).toBeNull();
  });

  it("persists the assembled report with the account history, the duration and both sides", async () => {
    withAiKey();
    const extractVisitReport = jest.fn().mockResolvedValue(extraction);
    const meetings = meetingsRepository();
    meetings.findLatestAnalysisForMeeting.mockImplementation(
      async ({ meetingId }: { meetingId: string }) =>
        meetingId === "m0"
          ? {
              result: {
                gridId: "DECOUVERTE",
                gridName: "Rendez-vous de découverte",
                overallScore: 52,
                blocks: [],
                criteria: [],
                pointsLost: [],
                keep: [],
                improve: [],
                stop: [],
                goldenQuestion: "q",
                challenge: "c",
                summary: "s",
              },
            }
          : null,
    );

    const result = await summarizeMeetingDetail(
      {
        analysis: { extractVisitReport } as never,
        prompts: prompts as never,
        meetings: meetings as never,
        users: {
          findAccountProfileByUserId: jest
            .fn()
            .mockResolvedValue({ firstName: "Julie", lastName: "Martin" }),
        } as never,
        organizationSettings: {
          findByOrganizationId: jest
            .fn()
            .mockResolvedValue({ companyName: "Acme Conseil" }),
        } as never,
      },
      {
        meeting,
        discResult: null,
        soncasResult: null,
        kissResult: null,
        organizationId: "org1",
      },
    );

    expect(result.meetingSynthesis).toContain(
      "TechVision · 24 janvier 2026 · Découverte · 45 min",
    );
    expect(result.meetingSynthesis).toContain(
      "1 rendez-vous antérieur avec ce contact :\n- 10 décembre 2025 · Découverte · Julie Martin · grille 52 sur 100",
    );
    expect(result.meetingSynthesis).not.toContain("1 février 2026");
    expect(meetings.updateMeetingVisitReportDraft).toHaveBeenCalledWith({
      id: "m1",
      organizationId: "org1",
      visitReportDraft: result.meetingSynthesis,
    });
  });

  it("falls back when the model fails", async () => {
    withAiKey();
    const extractVisitReport = jest.fn().mockRejectedValue(new Error("boom"));

    const result = await summarizeMeetingDetail(
      { analysis: { extractVisitReport } as never, prompts: prompts as never },
      { meeting, discResult: null, soncasResult: null, kissResult: null },
    );

    expect(result.fromAi).toBe(false);
  });
});

describe("generateAndPersistMeetingVisitReport", () => {
  it("persists the visit report while the meeting is still processing", async () => {
    withAiKey();
    const extractVisitReport = jest.fn().mockResolvedValue(extraction);
    const meetings = meetingsRepository();

    await generateAndPersistMeetingVisitReport(
      {
        analysis: { extractVisitReport } as never,
        prompts: prompts as never,
        meetings: meetings as never,
      },
      {
        organizationId: "org1",
        meeting: { ...meeting, status: "PROCESSING" },
        discResult: null,
        soncasResult: null,
        kissResult: null,
      },
    );

    expect(meetings.updateMeetingVisitReportDraft).toHaveBeenCalledTimes(1);
    const saved = meetings.updateMeetingVisitReportDraft.mock.calls[0][0];
    expect(saved.visitReportDraft.startsWith("COMPTE RENDU DE VISITE")).toBe(
      true,
    );
  });
});
