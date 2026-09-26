import { streamMeetingVisitReport } from "./stream-meeting-visit-report";

jest.mock("@/lib/env", () => ({
  getEnv: jest.fn(() => ({ AI_GATEWAY_API_KEY: "key" })),
}));
jest.mock("@/lib/load-analysis-prompt", () => ({
  loadAnalysisPromptMarkdown: jest.fn(async () => "prompt"),
}));
jest.mock("@/lib/load-analysis-model", () => ({
  resolvePromptGatewayModel: jest.fn(async () => "openai/gpt-4o-mini"),
}));

const meeting: {
  id: string;
  sellerUserId: string;
  personId: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: Date;
  outcome: "FOLLOW_UP";
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  feeling: number | null;
  status: "READY" | "PROCESSING";
  errorMessage: string | null;
  followUpEmailDraft: string | null;
  visitReportDraft: string | null;
  transcript: string;
  notes: string | null;
  durationMin: number | null;
  sourceType: "TRANSCRIPT";
  sourceBlobUrl: string | null;
  updatedAt: Date;
  analyses: never[];
} = {
  id: "m1",
  sellerUserId: "u1",
  personId: "p1",
  prospectName: "Antoine Lambert",
  prospectCompany: "TechVision",
  meetingAt: new Date("2026-09-20T10:00:00.000Z"),
  outcome: "FOLLOW_UP" as const,
  meetingType: "Découverte",
  pipelineStage: null,
  potentialAmount: null,
  feeling: null,
  status: "READY" as const,
  errorMessage: null,
  followUpEmailDraft: null,
  visitReportDraft: null,
  transcript: "Bonjour, parlons budget.",
  notes: null,
  durationMin: null,
  sourceType: "TRANSCRIPT",
  sourceBlobUrl: null,
  updatedAt: new Date(),
  analyses: [],
};

async function* chunks(parts: string[]) {
  for (const p of parts) yield p;
}

function makeDeps(row: typeof meeting | null) {
  const updateMeetingVisitReportDraft = jest.fn().mockResolvedValue(true);
  const streamMock = jest.fn().mockResolvedValue({
    textStream: chunks(["Compte-rendu ", "de visite"]),
    text: Promise.resolve("Compte-rendu de visite  "),
  });
  return {
    deps: {
      meetings: {
        findMeetingDetailWithAnalyses: jest.fn().mockResolvedValue(row),
        updateMeetingVisitReportDraft,
      },
      prompts: {},
      analysis: { streamMeetingVisitReport: streamMock },
    },
    updateMeetingVisitReportDraft,
    streamMock,
  };
}

describe("streamMeetingVisitReport", () => {
  it("rend le compte rendu enregistré sans appeler le modèle", async () => {
    const { deps, streamMock } = makeDeps({
      ...meeting,
      visitReportDraft: "Déjà écrit.",
    });

    const result = await streamMeetingVisitReport(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
    });

    expect(result).toEqual({ kind: "stored", text: "Déjà écrit." });
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("écrit au fil de l'eau puis enregistre le texte complet, sans espaces de bord", async () => {
    const { deps, updateMeetingVisitReportDraft } = makeDeps(meeting);

    const result = await streamMeetingVisitReport(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
    });
    if (result.kind !== "stream") throw new Error("stream attendu");

    const received: string[] = [];
    for await (const c of result.textStream) received.push(c);
    await result.persisted;

    expect(received.join("")).toBe("Compte-rendu de visite");
    expect(updateMeetingVisitReportDraft).toHaveBeenCalledWith({
      id: "m1",
      organizationId: "org1",
      visitReportDraft: "Compte-rendu de visite",
    });
  });

  it("attend la fin de l'analyse avant d'écrire", async () => {
    const { deps } = makeDeps({ ...meeting, status: "PROCESSING" });

    const result = await streamMeetingVisitReport(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
    });

    expect(result).toEqual({ kind: "not_ready" });
  });

  it("dit l'absence du rendez-vous plutôt que de deviner", async () => {
    const { deps } = makeDeps(null);

    const result = await streamMeetingVisitReport(deps as never, {
      organizationId: "org1",
      meetingId: "zz",
    });

    expect(result).toEqual({ kind: "not_found" });
  });
});
