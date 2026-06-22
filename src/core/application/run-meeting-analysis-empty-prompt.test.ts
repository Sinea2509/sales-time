import { describe, expect, it } from "@jest/globals";

jest.mock("@/lib/default-analysis-prompts", () => ({
  DEFAULT_ANALYSIS_PROMPT_MARKDOWN: {
    SONCAS: "   ",
    DISC: "disc prompt",
    KISS: "kiss prompt",
  },
}));

import { runMeetingAnalysis } from "./run-meeting-analysis";

describe("runMeetingAnalysis empty default prompt", () => {
  it("returns PROMPT_NOT_CONFIGURED when default markdown is blank", async () => {
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
      ensureCurrentVersion: jest.fn(),
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
        aiLogs,
      } as never,
      {
        organizationId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
      },
    );

    expect(result).toEqual({ ok: false, error: "PROMPT_NOT_CONFIGURED" });
    expect(prompts.ensureCurrentVersion).not.toHaveBeenCalled();
    expect(aiLogs.createLog).toHaveBeenCalled();
  });
});
