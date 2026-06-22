import {
  generateAndPersistMeetingVisitReport,
  summarizeMeetingDetail,
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

describe("summarizeMeetingDetail", () => {
  it("returns stored visit report when present", async () => {
    const result = await summarizeMeetingDetail(
      { analysis: { summarizeMeetingDetail: jest.fn() } as never, prompts: {} as never },
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
      { analysis: { summarizeMeetingDetail: jest.fn() } as never, prompts: {} as never },
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
      { analysis: { summarizeMeetingDetail: jest.fn() } as never, prompts: {} as never },
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

  it("calls analysis when AI key is set", async () => {
    const { getEnv } = jest.requireMock<{ getEnv: jest.Mock }>("@/lib/env");
    getEnv.mockReturnValue({ AI_GATEWAY_API_KEY: "key" });

    const summarizeMeetingDetailMock = jest.fn().mockResolvedValue({
      meetingSynthesis: "Compte-rendu IA.",
      interlocutorProfile: "Profil IA.",
    });
    const prompts = {
      getCurrentVersion: jest.fn().mockResolvedValue(null),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };

    const result = await summarizeMeetingDetail(
      {
        analysis: { summarizeMeetingDetail: summarizeMeetingDetailMock } as never,
        prompts: prompts as never,
      },
      { meeting, discResult: null, soncasResult: null, kissResult: null },
    );

    expect(result.fromAi).toBe(true);
    expect(result.meetingSynthesis).toBe("Compte-rendu IA.");
    expect(summarizeMeetingDetailMock).toHaveBeenCalled();
  });
});

describe("generateAndPersistMeetingVisitReport", () => {
  it("persists AI visit report", async () => {
    const { getEnv } = jest.requireMock<{ getEnv: jest.Mock }>("@/lib/env");
    getEnv.mockReturnValue({ AI_GATEWAY_API_KEY: "key" });

    const summarizeMeetingDetailMock = jest.fn().mockResolvedValue({
      meetingSynthesis: "Compte-rendu CRM.",
      interlocutorProfile: "Profil.",
    });
    const updateMeetingVisitReportDraft = jest.fn().mockResolvedValue(true);
    const prompts = {
      getCurrentVersion: jest.fn().mockResolvedValue(null),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };

    await generateAndPersistMeetingVisitReport(
      {
        analysis: { summarizeMeetingDetail: summarizeMeetingDetailMock } as never,
        prompts: prompts as never,
        meetings: { updateMeetingVisitReportDraft } as never,
      },
      {
        organizationId: "org1",
        meeting: { ...meeting, status: "PROCESSING" },
        discResult: null,
        soncasResult: null,
        kissResult: null,
      },
    );

    expect(updateMeetingVisitReportDraft).toHaveBeenCalledWith({
      id: "m1",
      organizationId: "org1",
      visitReportDraft: "Compte-rendu CRM.",
    });
  });
});
