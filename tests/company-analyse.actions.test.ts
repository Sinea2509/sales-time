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

// eslint-disable-next-line no-var
var requireMeetingMutationAccessMock: JestFn;
jest.mock("@/lib/meeting-mutation-access", () => {
  requireMeetingMutationAccessMock = jest.fn();
  return {
    requireMeetingMutationAccess: (...args: unknown[]) =>
      requireMeetingMutationAccessMock(...args),
  };
});

import { runMeetingAnalysisAction } from "@/app/[locale]/company/analyse/actions";

let findOrganizationSettingsMock: JestFn;

beforeEach(() => {
  jest.clearAllMocks();
  findOrganizationSettingsMock = jest.fn().mockResolvedValue({
    companyName: "Acme",
    playbook: { offer: "Du conseil" },
  });
  requireAnalysisActorMock.mockResolvedValue({
    ok: true,
    organizationId: ORG_ID,
    actorUserId: "user_1",
    email: "seller@test.com",
    canManageOrganization: true,
    deps: {
      meetings: {},
      organizationSettings: {
        findByOrganizationId: findOrganizationSettingsMock,
      },
    },
  });
  requireMeetingMutationAccessMock.mockResolvedValue({
    ok: true,
    meeting: { sellerUserId: "user_1" },
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
    const result = await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("runs SONCAS analysis and revalidates paths", async () => {
    const result = await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    expect(result).toEqual({ ok: true, analysisId: "analysis_1" });
    expect(runMeetingAnalysisMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: ORG_ID,
        meetingId: MEETING_ID,
        kind: "SONCAS",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/analyse");
  });

  it("runs DISC analysis", async () => {
    await runMeetingAnalysisAction(MEETING_ID, "DISC");
    expect(runMeetingAnalysisMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: "DISC" }),
    );
  });

  it("runs KISS analysis with commercial appendix", async () => {
    await runMeetingAnalysisAction(MEETING_ID, "KISS");
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

  it("joint le playbook de l organisation a l analyse", async () => {
    await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    expect(findOrganizationSettingsMock).toHaveBeenCalledWith(ORG_ID);
    const passe = runMeetingAnalysisMock.mock.calls[0][1] as {
      organizationPlaybookMarkdown: string | null;
    };
    expect(passe.organizationPlaybookMarkdown).toContain("Du conseil");
    expect(passe.organizationPlaybookMarkdown).toContain("Acme");
  });

  it("n envoie aucun playbook quand l organisation n a rien renseigne", async () => {
    findOrganizationSettingsMock.mockResolvedValue(null);
    await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    const passe = runMeetingAnalysisMock.mock.calls[0][1] as {
      organizationPlaybookMarkdown: string | null;
    };
    expect(passe.organizationPlaybookMarkdown).toBeNull();
  });

  it("returns forbidden when mutation access is denied", async () => {
    requireMeetingMutationAccessMock.mockResolvedValue({
      ok: false,
      error: "FORBIDDEN",
    });
    const result = await runMeetingAnalysisAction(MEETING_ID, "SONCAS");
    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(runMeetingAnalysisMock).not.toHaveBeenCalled();
  });
});
