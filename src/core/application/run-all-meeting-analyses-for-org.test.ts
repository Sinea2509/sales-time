import { runAllMeetingAnalysesForOrg } from "./run-all-meeting-analyses-for-org";
import { runMeetingAnalysis } from "./run-meeting-analysis";

jest.mock("./run-meeting-analysis", () => ({
  runMeetingAnalysis: jest.fn(),
}));

const runMeetingAnalysisMock = runMeetingAnalysis as jest.MockedFunction<
  typeof runMeetingAnalysis
>;

function makeDeps() {
  return {
    meetings: {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org1",
        personId: "p1",
        prospectName: "Alice",
        sellerUserId: "u1",
      }),
      updateMeetingStatus: jest.fn().mockResolvedValue(true),
      updateMeetingVisitReportDraft: jest.fn().mockResolvedValue(true),
      findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
      findMeetingDetailWithAnalyses: jest.fn().mockResolvedValue(null),
      updatePersonProfileCache: jest.fn().mockResolvedValue(undefined),
    },
    prompts: {},
    analysis: {},
    globalKissCoachingPrompts: {
      getPrompts: jest.fn().mockResolvedValue(null),
    },
    notifications: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    users: {
      findEmailById: jest.fn().mockResolvedValue(null),
    },
  };
}

describe("runAllMeetingAnalysesForOrg", () => {
  beforeEach(() => {
    runMeetingAnalysisMock.mockReset();
  });

  it("runs SONCAS, DISC, then KISS and marks meeting READY", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    expect(runMeetingAnalysisMock).toHaveBeenCalledTimes(3);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "READY" }),
    );
  });

  it("marks meeting FAILED when an analysis step fails", async () => {
    runMeetingAnalysisMock
      .mockResolvedValueOnce({ ok: true, analysisId: "a1" })
      .mockResolvedValueOnce({
        ok: false,
        error: "ANALYSIS_FAILED",
        message: "boom",
      });
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result.ok).toBe(false);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "FAILED", errorMessage: "boom" }),
    );
  });

  it("lit le playbook une seule fois et le donne aux trois analyses", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });
    const findByOrganizationId = jest.fn().mockResolvedValue({
      companyName: "Acme",
      playbook: { offer: "Formation commerciale" },
    });
    const deps = {
      ...makeDeps(),
      organizationSettings: { findByOrganizationId },
    };

    await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    /*
      Une seule lecture pour les trois analyses : une modification du playbook
      en cours de séquence ne doit pas faire juger le même RDV sur deux
      contextes différents.
    */
    expect(findByOrganizationId).toHaveBeenCalledTimes(1);
    expect(findByOrganizationId).toHaveBeenCalledWith("org1");
    for (const call of runMeetingAnalysisMock.mock.calls) {
      const markdown = call[1].organizationPlaybookMarkdown ?? "";
      expect(markdown).toContain("## Playbook de l'organisation");
      expect(markdown).toContain("Formation commerciale");
      expect(markdown).toContain("Acme");
    }
  });

  it("tourne sans playbook quand le port des réglages est absent", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });

    const result = await runAllMeetingAnalysesForOrg(makeDeps() as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    for (const call of runMeetingAnalysisMock.mock.calls) {
      expect(call[1].organizationPlaybookMarkdown).toBeNull();
    }
  });
});
