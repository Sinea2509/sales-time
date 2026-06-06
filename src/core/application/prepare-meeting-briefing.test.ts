import { describe, expect, it } from "@jest/globals";
import { prepareMeetingBriefing } from "./prepare-meeting-briefing";

const briefingResult = {
  lastMeetingSummary: "Synthèse du dernier échange.",
  discDominant: "I",
  soncasDominant: "argent",
  startActions: ["Préparer démo"],
  customQuestions: ["Budget ?"],
  openPoints: ["Délai"],
  stageAdvice: "Focus ROI.",
  genericAdvice: false,
};

describe("prepareMeetingBriefing", () => {
  it("returns null when person is not found", async () => {
    const deps = {
      contacts: { findById: jest.fn().mockResolvedValue(null) },
      meetings: { listMeetingsForPersonOrdered: jest.fn() },
      analysis: { prepareMeetingBriefing: jest.fn() },
      prompts: { getCurrentVersion: jest.fn() },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_missing",
      targetStage: "Proposition",
      model: "openai/gpt-4o-mini",
    });

    expect(result).toBeNull();
    expect(deps.analysis.prepareMeetingBriefing).not.toHaveBeenCalled();
  });

  it("calls analysis with enriched history and returns briefing", async () => {
    const kissResult = {
      keep: ["k"],
      improve: ["open point"],
      stop: ["s"],
      start: ["question 1", "question 2"],
      goldenQuestion: "gq",
      coachingScore: 7,
      coachingScoreJustification: "j",
      summary: "Meeting went well overall with good rapport.",
    };

    const deps = {
      contacts: {
        findById: jest.fn().mockResolvedValue({
          id: "person_1",
          displayName: "Alice",
          company: "Acme",
        }),
      },
      meetings: {
        listMeetingsForPersonOrdered: jest.fn().mockResolvedValue([
          {
            id: "m1",
            meetingAt: new Date("2026-05-01T00:00:00.000Z"),
            pipelineStage: "Découverte",
          },
        ]),
        findMeetingDetailWithAnalyses: jest.fn().mockResolvedValue({
          analyses: [
            { kind: "KISS", result: kissResult },
            {
              kind: "DISC",
              result: {
                scores: { D: 20, I: 80, S: 40, C: 30 },
                dominant: "I",
                evidence: ["e"],
                summary: "s",
              },
            },
            {
              kind: "SONCAS",
              result: {
                drivers: {
                  securite: { score: 50, evidence: ["e"] },
                  orgueil: { score: 50, evidence: ["e"] },
                  nouveaute: { score: 50, evidence: ["e"] },
                  confort: { score: 50, evidence: ["e"] },
                  argent: { score: 90, evidence: ["e"] },
                  sympathie: { score: 50, evidence: ["e"] },
                },
                dominant: "argent",
                summary: "s",
              },
            },
          ],
        }),
      },
      analysis: {
        prepareMeetingBriefing: jest
          .fn()
          .mockResolvedValue({ result: briefingResult }),
      },
      prompts: {
        getCurrentVersion: jest.fn().mockResolvedValue({
          markdown: "Briefing system prompt",
        }),
      },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_1",
      targetStage: "Proposition",
      model: "openai/gpt-4o-mini",
    });

    expect(result?.hasHistory).toBe(true);
    expect(result?.person.displayName).toBe("Alice");
    expect(result?.briefing).toEqual(briefingResult);
    expect(deps.analysis.prepareMeetingBriefing).toHaveBeenCalledWith(
      expect.objectContaining({
        systemMarkdown: "Briefing system prompt",
        targetStage: "Proposition",
        prospectCompany: "Acme",
        hasHistory: true,
      }),
    );
  });
});
