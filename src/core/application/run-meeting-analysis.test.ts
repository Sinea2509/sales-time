import { describe, expect, it, vi } from "vitest";
import { runMeetingAnalysis } from "./run-meeting-analysis";

describe("runMeetingAnalysis", () => {
  it("returns MEETING_NOT_FOUND when id missing for org", async () => {
    const meetings = {
      findMeetingByIdForOrg: vi.fn().mockResolvedValue(null),
    };
    const prompts = { getCurrentVersion: vi.fn() };
    const analysis = {
      analyzeSoncas: vi.fn(),
      analyzeDisc: vi.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        clerkOrgId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
        model: "openai/gpt-4o-mini",
      },
    );

    expect(result).toEqual({ ok: false, error: "MEETING_NOT_FOUND" });
    expect(prompts.getCurrentVersion).not.toHaveBeenCalled();
  });

  it("returns PROMPT_NOT_CONFIGURED when no template version", async () => {
    const meetings = {
      findMeetingByIdForOrg: vi.fn().mockResolvedValue({
        id: "m1",
        clerkOrgId: "org_1",
        transcript: "Hello",
        notes: null,
      }),
    };
    const prompts = { getCurrentVersion: vi.fn().mockResolvedValue(null) };
    const analysis = { analyzeSoncas: vi.fn(), analyzeDisc: vi.fn() };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        clerkOrgId: "org_1",
        meetingId: "m1",
        kind: "DISC",
        model: "openai/gpt-4o-mini",
      },
    );

    expect(result).toEqual({ ok: false, error: "PROMPT_NOT_CONFIGURED" });
  });

  it("persists SONCAS analysis on success", async () => {
    const meetings = {
      findMeetingByIdForOrg: vi.fn().mockResolvedValue({
        id: "m1",
        clerkOrgId: "org_1",
        transcript: "Bonjour",
        notes: "Rdv commercial",
      }),
      createAnalysis: vi.fn().mockResolvedValue({
        id: "a1",
        meetingId: "m1",
        kind: "SONCAS",
        model: "openai/gpt-4o-mini",
        result: {},
        createdAt: new Date(),
      }),
    };
    const prompts = {
      getCurrentVersion: vi.fn().mockResolvedValue({
        id: "pv1",
        markdown: "sys",
        templateId: "t1",
        kind: "SONCAS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
    };
    const analysis = {
      analyzeSoncas: vi.fn().mockResolvedValue({
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
      analyzeDisc: vi.fn(),
    };

    const result = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      {
        clerkOrgId: "org_1",
        meetingId: "m1",
        kind: "SONCAS",
        model: "openai/gpt-4o-mini",
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
});
