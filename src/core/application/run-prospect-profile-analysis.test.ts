import { describe, expect, it } from "@jest/globals";
import { runProspectProfileAnalysis } from "./run-prospect-profile-analysis";
import { noOrganizationPrompts } from "./testing/in-memory-organization-prompts";

const TRANSCRIPT = [
  "Cédric   0:01",
  "Bonjour Lisa, qu'est-ce qui compte pour vous dans le choix d'un prestataire ?",
  "Lisa ANDROLUS   0:05",
  "On a été très déçus de la qualité des prestations passées.",
  "Cédric   0:09",
  "Et le prix, c'est un sujet ?",
  "Lisa ANDROLUS   0:12",
  "On n'est pas sur ces ordres de prix en général.",
].join("\n");

function makeDeps() {
  const meetings = {
    findMeetingByIdForOrg: jest.fn().mockResolvedValue({
      id: "m1",
      organizationId: "org_1",
      transcript: TRANSCRIPT,
      notes: null,
      prospectName: "Lisa Androlus",
      meetingType: "DECOUVERTE",
      pipelineStage: null,
      sourceBlobUrl: null,
      sourceType: "TEXT",
    }),
    createAnalysis: jest
      .fn()
      .mockImplementation(async (row: { kind: string }) => ({
        id: `a-${row.kind}`,
      })),
  };
  const prompts = {
    ensureCurrentVersion: jest
      .fn()
      .mockImplementation(async ({ kind }: { kind: string }) => ({
        id: `v-${kind}`,
        version: 3,
        markdown: `Consigne ${kind}.`,
      })),
    getModelForKind: jest
      .fn()
      .mockImplementation(async ({ kind }: { kind: string }) =>
        kind === "SONCAS" ? "anthropic/claude-haiku-5.5" : "openai/gpt-4o",
      ),
  };
  const analysis = {
    analyzeProspectProfile: jest.fn().mockResolvedValue({
      result: {
        soncas: {
          moments: [
            {
              moment: "0:05",
              topic: "experience_passee",
              sellerQuestion:
                "Bonjour Lisa, qu'est-ce qui compte pour vous dans le choix d'un prestataire ?",
              prospectWords:
                "On a été très déçus de la qualité des prestations passées.",
              levers: [{ lever: "securite", strength: "nette" }],
              reading: "Elle veut éviter une nouvelle déception.",
            },
          ],
          summary: "Sécurité.",
          mainLever: "securite",
          actionableAdvice: {
            whatItMeans: "a",
            howToTalk: "b",
            whatToAvoid: "c",
          },
        },
        disc: {
          moments: [
            {
              moment: "0:12",
              situation: "reaction_au_prix",
              prospectWords: "On n'est pas sur ces ordres de prix en général.",
              behaviour: "Posée, factuelle.",
              styles: [{ style: "C", strength: "nette" }],
            },
          ],
          summary: "Conformité.",
          actionableAdvice: {
            whatItMeans: "a",
            howToTalk: "b",
            whatToAvoid: "c",
          },
        },
        objections: { objections: [] },
      },
      usage: { inputTokens: 1000, outputTokens: 200 },
    }),
  };
  const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
  return {
    meetings,
    prompts,
    organizationPrompts: noOrganizationPrompts(),
    analysis,
    aiLogs,
  };
}

describe("runProspectProfileAnalysis", () => {
  it("lit SONCAS, DISC et les objections en un seul appel, et les enregistre à part", async () => {
    const deps = makeDeps();

    const outcome = await runProspectProfileAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
    });

    expect(outcome).toEqual({
      SONCAS: { ok: true, analysisId: "a-SONCAS" },
      DISC: { ok: true, analysisId: "a-DISC" },
      OBJECTIONS: { ok: true, analysisId: "a-OBJECTIONS" },
    });
    expect(deps.analysis.analyzeProspectProfile).toHaveBeenCalledTimes(1);
    const call = deps.analysis.analyzeProspectProfile.mock.calls[0][0] as {
      systemPrompt: string;
      model: string;
    };
    // Le modèle réglé pour SONCAS sert aux trois lectures.
    expect(call.model).toBe("anthropic/claude-haiku-5.5");
    // Chaque consigne est dans la consigne assemblée, une fois.
    for (const kind of ["SONCAS", "DISC", "OBJECTIONS"]) {
      expect(call.systemPrompt.split(`Consigne ${kind}.`)).toHaveLength(2);
    }
    // Chaque analyse pointe vers la version de sa propre consigne.
    const rows = deps.meetings.createAnalysis.mock.calls.map(
      (c) => c[0] as { kind: string; promptVersionId: string },
    );
    expect(rows.map((r) => [r.kind, r.promptVersionId])).toEqual([
      ["SONCAS", "v-SONCAS"],
      ["DISC", "v-DISC"],
      ["OBJECTIONS", "v-OBJECTIONS"],
    ]);
    // Le produit a calculé les notes à partir des passages retrouvés.
    const soncas = rows[0] as unknown as {
      result: { dominant: string; drivers: { securite: { score: number } } };
    };
    expect(soncas.result.dominant).toBe("securite");
    expect(soncas.result.drivers.securite.score).toBe(45);
  });

  it("marque les trois analyses en échec quand l'appel échoue", async () => {
    const deps = makeDeps();
    deps.analysis.analyzeProspectProfile.mockRejectedValue(new Error("boom"));

    const outcome = await runProspectProfileAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
    });

    expect(outcome.SONCAS).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });
    expect(outcome.DISC).toEqual(outcome.SONCAS);
    expect(outcome.OBJECTIONS).toEqual(outcome.SONCAS);
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
  });
});
