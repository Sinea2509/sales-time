import { describe, expect, it } from "@jest/globals";
import { prepareMeetingBriefing } from "./prepare-meeting-briefing";

const briefingResult = {
  lastMeetingSummary: "Synthèse du dernier échange.",
  discDominant: "I",
  soncasDominant: "argent",
  meetingGoal: "Obtenir le budget.",
  goldenQuestion: "Qu'est-ce qui ferait de ce projet une réussite ?",
  goldenQuestionWhy: "Les critères de succès manquent.",
  howToTalk: "Allez droit au chiffre.",
  startActions: ["Préparer démo"],
  customQuestions: ["Budget ?"],
  likelyObjections: [],
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
      prompts: {
        getCurrentVersion: jest.fn(),
        getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
      },
      organizationSettings: { findByOrganizationId: jest.fn() },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_missing",
      targetStage: "Proposition",
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
        getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
      },
      organizationSettings: {
        findByOrganizationId: jest.fn().mockResolvedValue(null),
      },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_1",
      targetStage: "Proposition",
    });

    expect(result?.hasHistory).toBe(true);
    expect(result?.person.displayName).toBe("Alice");
    expect(result?.briefing).toEqual(briefingResult);
    expect(deps.analysis.prepareMeetingBriefing).toHaveBeenCalledWith(
      expect.objectContaining({
        systemMarkdown: expect.stringContaining("Briefing system prompt"),
        targetStage: "Proposition",
        prospectCompany: "Acme",
        prospectName: "Alice",
        hasHistory: true,
      }),
    );
    const appel = deps.analysis.prepareMeetingBriefing.mock.calls[0]![0] as {
      priorMeetingsJson: string;
      systemMarkdown: string;
    };
    const historique = JSON.parse(appel.priorMeetingsJson) as {
      goldenQuestion: string | null;
    }[];
    expect(historique[0]?.goldenQuestion).toBe("gq");
    expect(appel.systemMarkdown).toContain("## Noms de référence");
    expect(appel.systemMarkdown).toContain("« Alice »");
    // Les défis écrits pour ce rendez-vous sont rendus tels quels à l'écran.
    expect(result?.challenges.length).toBeGreaterThan(0);
  });

  it("limite un commercial à ses propres rendez-vous avec ce contact", async () => {
    const listMeetingsForPersonOrdered = jest.fn().mockResolvedValue([]);
    const deps = {
      contacts: {
        findById: jest.fn().mockResolvedValue({
          id: "person_1",
          displayName: "Alice",
          company: null,
          jobTitle: null,
        }),
      },
      meetings: { listMeetingsForPersonOrdered },
      analysis: {
        prepareMeetingBriefing: jest
          .fn()
          .mockResolvedValue({ result: briefingResult }),
      },
      prompts: {
        getCurrentVersion: jest.fn().mockResolvedValue({ markdown: "P" }),
        getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
      },
      organizationSettings: {
        findByOrganizationId: jest.fn().mockResolvedValue(null),
      },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_1",
      targetStage: "Proposition",
      visibleTo: "user_1",
    });

    expect(listMeetingsForPersonOrdered).toHaveBeenCalledWith({
      organizationId: "org_1",
      personId: "person_1",
      limit: 5,
      sellerUserId: "user_1",
    });
    expect(result?.hasHistory).toBe(false);
    expect(result?.challenges).toEqual([]);
  });

  it("retire des objections les preuves anonymes, que le commercial répéterait", async () => {
    const deps = {
      contacts: {
        findById: jest.fn().mockResolvedValue({
          id: "person_1",
          displayName: "Alice",
          company: null,
          jobTitle: null,
        }),
      },
      meetings: {
        listMeetingsForPersonOrdered: jest.fn().mockResolvedValue([]),
      },
      analysis: {
        prepareMeetingBriefing: jest.fn().mockResolvedValue({
          result: {
            ...briefingResult,
            likelyObjections: [
              {
                objection: "C'est trop cher",
                answer:
                  "Revenons à votre enjeu et à ce que ce retard vous coûte. Nos clients sont ravis.",
              },
            ],
          },
        }),
      },
      prompts: {
        getCurrentVersion: jest.fn().mockResolvedValue({ markdown: "P" }),
        getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
      },
      organizationSettings: {
        findByOrganizationId: jest.fn().mockResolvedValue(null),
      },
    };

    const result = await prepareMeetingBriefing(deps as never, {
      organizationId: "org_1",
      personId: "person_1",
      targetStage: "Proposition",
    });

    expect(result?.briefing.likelyObjections).toEqual([
      {
        objection: "C'est trop cher",
        answer: "Revenons à votre enjeu et à ce que ce retard vous coûte.",
      },
    ]);
  });
});
