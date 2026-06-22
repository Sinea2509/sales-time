import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

const ORG_ID = "clorg00000000000000000001";
const MEETING_ID = "clh12345678901234567890123";

// eslint-disable-next-line no-var
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var requireAnalysisActorMock: JestFn;
jest.mock("@/lib/analysis-server-context", () => {
  requireAnalysisActorMock = jest.fn();
  return { requireAnalysisActor: requireAnalysisActorMock };
});

// eslint-disable-next-line no-var
var runMeetingAnalysisMock: JestFn;
jest.mock("@/src/core/application/run-meeting-analysis", () => {
  runMeetingAnalysisMock = jest.fn();
  return { runMeetingAnalysis: runMeetingAnalysisMock };
});

// eslint-disable-next-line no-var
var loadCommercialKissAppendixMock: JestFn;
jest.mock("@/lib/kiss-commercial-appendix", () => {
  loadCommercialKissAppendixMock = jest.fn().mockResolvedValue("appendix");
  return { loadCommercialKissAppendix: loadCommercialKissAppendixMock };
});

import {
  runDiscAnalysisAction,
  runKissAnalysisAction,
  runMeetingAnalysisAction,
  runSoncasAnalysisAction,
} from "@/app/[locale]/company/analyse/actions";

beforeEach(() => {
  jest.clearAllMocks();
  requireAnalysisActorMock.mockResolvedValue({
    ok: true,
    organizationId: ORG_ID,
    deps: {},
  });
  runMeetingAnalysisMock.mockResolvedValue({
    ok: true,
    analysisId: "analysis_1",
  });
});

describe("company analyse actions", () => {
  it("rejects invalid meeting id", async () => {
    const result = await runMeetingAnalysisAction("bad-id", "SONCAS");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
    expect(requireAnalysisActorMock).not.toHaveBeenCalled();
  });

  it("returns actor error when analysis context is missing", async () => {
    requireAnalysisActorMock.mockResolvedValue({
      ok: false,
      error: "UNAUTHENTICATED",
    });
    const result = await runSoncasAnalysisAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("runs SONCAS analysis and revalidates paths", async () => {
    const result = await runSoncasAnalysisAction(MEETING_ID);
    expect(result).toEqual({ ok: true, analysisId: "analysis_1" });
    expect(runMeetingAnalysisMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        organizationId: ORG_ID,
        meetingId: MEETING_ID,
        kind: "SONCAS",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/analyse");
  });

  it("runs DISC analysis", async () => {
    await runDiscAnalysisAction(MEETING_ID);
    expect(runMeetingAnalysisMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: "DISC" }),
    );
  });

  it("runs KISS analysis with commercial appendix", async () => {
    await runKissAnalysisAction(MEETING_ID);
    expect(loadCommercialKissAppendixMock).toHaveBeenCalled();
    expect(runMeetingAnalysisMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "KISS",
        kissSystemMarkdownAppendix: "appendix",
      }),
    );
  });

  it("propagates analysis failure message", async () => {
    runMeetingAnalysisMock.mockResolvedValue({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });
    const result = await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });
  });
});
