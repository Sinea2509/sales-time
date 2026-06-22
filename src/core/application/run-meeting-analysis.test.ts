import { describe, expect, it } from "@jest/globals";
import { runMeetingAnalysis } from "./run-meeting-analysis";

describe("runMeetingAnalysis", () => {
  it("returns MEETING_NOT_FOUND when id missing for org", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue(null),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn(),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
      },
    );

    expect(result).toEqual({ ok: false, error: "MEETING_NOT_FOUND" });
    expect(prompts.ensureCurrentVersion).not.toHaveBeenCalled();
  });

  it("returns PROMPT_NOT_CONFIGURED when prompt bootstrap fails", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "Hello",
        notes: null,
      }),
    };
    const prompts = {
      ensureCurrentVersion: jest
        .fn()
        .mockRejectedValue(new Error("Cannot seed prompt template")),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "DISC",
      },
    );

    expect(result).toEqual({
      ok: false,
      error: "PROMPT_NOT_CONFIGURED",
      message: "Cannot seed prompt template",
    });
  });

  it("persists SONCAS analysis on success", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "Bonjour",
        notes: "Rdv commercial",
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a1",
        meetingId: "m1",
        kind: "SONCAS",
        model: "openai/gpt-4o-mini",
        result: {},
        createdAt: new Date(),
      }),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv1",
        markdown: "sys",
        templateId: "t1",
        kind: "SONCAS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn().mockResolvedValue({
        result: {
          drivers: {
            securite: { score: 10, evidence: ["e1"] },
            orgueil: { score: 10, evidence: ["e"] },
            nouveaute: { score: 10, evidence: ["e"] },
            confort: { score: 10, evidence: ["e"] },
            argent: { score: 10, evidence: ["e"] },
            sympathie: { score: 80, evidence: ["e2"] },
          },
          dominant: "sympathie" as const,
          summary: "ok",
        },
      }),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
      },
    );

    expect(result).toEqual({ ok: true, analysisId: "a1" });
    expect(meetings.createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingId: "m1",
        kind: "SONCAS",
        promptVersionId: "pv1",
        model: "openai/gpt-4o-mini",
      }),
    );
  });

  it("returns NO_ACTIVE_ORG when organization id is null", async () => {
    const result = await runMeetingAnalysis(
      {
        meetings: { findMeetingByIdForOrg: jest.fn() },
        prompts: {
          ensureCurrentVersion: jest.fn(),
          getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
        },
        analysis: {
          analyzeSoncas: jest.fn(),
          analyzeDisc: jest.fn(),
          analyzeKiss: jest.fn(),
        },
      } as never,
      {
        organizationId: null,
        meetingId: "m1",
        kind: "SONCAS",
      },
    );
    expect(result).toEqual({ ok: false, error: "NO_ACTIVE_ORG" });
  });

  it("persists DISC analysis on success", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "Hi",
        notes: null,
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a-disc",
        meetingId: "m1",
        kind: "DISC",
        model: "m",
        result: {},
        createdAt: new Date(),
      }),
      findLatestAnalysisForMeeting: jest.fn(),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv2",
        markdown: "disc",
        templateId: "t2",
        kind: "DISC" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn().mockResolvedValue({ result: { disc: true } }),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "DISC",
      },
    );

    expect(result).toEqual({ ok: true, analysisId: "a-disc" });
  });

  it("persists KISS with appendix and returns ANALYSIS_FAILED on error", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a-k",
        meetingId: "m1",
        kind: "KISS",
        model: "m",
        result: {},
        createdAt: new Date(),
      }),
      findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pvk",
        markdown: "base",
        templateId: "tk",
        kind: "KISS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn().mockRejectedValue(new Error("boom")),
    };

    const fail = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "KISS",
        kissSystemMarkdownAppendix: "  appendix  ",
      },
    );
    expect(fail).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });

    analysis.analyzeKiss = jest.fn().mockResolvedValue({ result: { k: 1 } });
    const ok = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "KISS",
        kissSystemMarkdownAppendix: "  appendix  ",
      },
    );
    expect(ok).toEqual({ ok: true, analysisId: "a-k" });

    const okNoAppendix = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "KISS",
      },
    );
    expect(okNoAppendix).toEqual({ ok: true, analysisId: "a-k" });

    const okBlankAppendix = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "KISS",
        kissSystemMarkdownAppendix: "   \t  ",
      },
    );
    expect(okBlankAppendix).toEqual({ ok: true, analysisId: "a-k" });
  });

  it("maps non-Error rejection to ANALYSIS_FAILED message", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      createAnalysis: jest.fn(),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv",
        markdown: "m",
        templateId: "t",
        kind: "SONCAS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn().mockRejectedValue("not-an-error"),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
      },
    );
    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "not-an-error",
    });
  });

  it("records ai log when prompt bootstrap fails", async () => {
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockRejectedValue(new Error("seed fail")),
      getModelForKind: jest.fn().mockRejectedValue(new Error("model fail")),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis, aiLogs } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
        jobId: "job_1",
      },
    );

    expect(result).toEqual({
      ok: false,
      error: "PROMPT_NOT_CONFIGURED",
      message: "seed fail",
    });
    expect(aiLogs.createLog).toHaveBeenCalled();
  });

  it("records ai log when SONCAS analysis fails", async () => {
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      createAnalysis: jest.fn(),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv",
        markdown: "sys",
        templateId: "t",
        kind: "SONCAS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn().mockRejectedValue(new Error("soncas fail")),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis, aiLogs } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
      },
    );

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "soncas fail",
    });
    expect(aiLogs.createLog).toHaveBeenCalled();
  });

  it("maps outer catch when prior analysis lookup throws", async () => {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      findLatestAnalysisForMeeting: jest
        .fn()
        .mockRejectedValue(new Error("db error")),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv",
        markdown: "m",
        templateId: "t",
        kind: "KISS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };

    const result = await runMeetingAnalysis(
      {
        meetings,
        prompts,
        analysis: {
          analyzeSoncas: jest.fn(),
          analyzeDisc: jest.fn(),
          analyzeKiss: jest.fn(),
        },
      } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "KISS",
      },
    );

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "db error",
    });
  });
});
