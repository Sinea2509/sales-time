import { describe, expect, it } from "@jest/globals";
import { DEFAULT_SCORECARD_GRID } from "@/src/core/domain/scorecard-grid";
import { runMeetingAnalysis } from "./run-meeting-analysis";
import { noOrganizationPrompts } from "./testing/in-memory-organization-prompts";

/*
  Le commercial doit être reconnu sûrement dans le transcript pour que la
  note mesure l'écoute, les questions et le côté des citations. Deviné, il
  ne l'est pas, et la note le dit (lot 92).
*/

const organizationPrompts = noOrganizationPrompts();

/** Un échange où les deux personnes ne sont connues que par leur prénom. */
const TRANSCRIPT = [
  "Camille : Bonjour Hélène, merci de me recevoir aujourd'hui.",
  "Hélène : Bonjour Camille, avec plaisir.",
  "Camille : Comment s'organise votre équipe commerciale aujourd'hui ?",
  "Hélène : Nous sommes douze commerciaux sur deux régions.",
  "Camille : Et qu'est-ce qui vous a amenée à regarder une formation ?",
  "Hélène : Les remises accordées trop vite, surtout en fin de trimestre.",
].join("\n");

function releveVide() {
  return {
    criteria: {},
    pointsLost: [],
    summary: "S",
  };
}

function harness(sellerName: string | null) {
  const meetings = {
    findMeetingByIdForOrg: jest.fn().mockResolvedValue({
      id: "m1",
      organizationId: "org_1",
      transcript: TRANSCRIPT,
      notes: null,
      meetingType: "RDV découverte",
      pipelineStage: null,
      // Le contact est enregistré sous un nom que le transcript n'emploie pas.
      prospectName: "Mme Dupont",
      sellerName,
    }),
    createAnalysis: jest.fn().mockResolvedValue({
      id: "a1",
      meetingId: "m1",
      kind: "SCORECARD",
      model: "m",
      result: {},
      createdAt: new Date(),
    }),
    findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
  };
  const prompts = {
    ensureCurrentVersion: jest.fn().mockResolvedValue({
      id: "pv",
      markdown: "base",
      templateId: "t",
      kind: "SCORECARD",
      version: 1,
      authorUserId: "u1",
      createdAt: new Date(),
    }),
    getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
  };
  const analysis = {
    analyzeScorecard: jest.fn().mockResolvedValue({
      result: { ...releveVide(), criteria: [] },
    }),
  };
  return { meetings, prompts, organizationPrompts, analysis };
}

async function analyse(sellerName: string | null) {
  const deps = harness(sellerName);
  const out = await runMeetingAnalysis(deps as never, {
    organizationId: "org_1",
    meetingId: "m1",
    kind: "SCORECARD",
  });
  expect(out).toEqual({ ok: true, analysisId: "a1" });
  const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
    result: {
      speakers: string;
      criteria: Array<{ key: string; level: number; learned?: string }>;
    };
  };
  const systemMarkdown = (
    deps.analysis.analyzeScorecard.mock.calls[0][0] as {
      systemMarkdown: string;
    }
  ).systemMarkdown;
  return { result: persiste.result, systemMarkdown };
}

describe("runMeetingAnalysis : le commercial reconnu ou deviné", () => {
  it("reconnaît le commercial à son nom, mesure l'écoute et les questions, et l'écrit avec la note", async () => {
    const { result, systemMarkdown } = await analyse("Camille Roux");
    expect(result.speakers).toBe("recognized");
    expect(result.criteria.map((c) => c.key).sort()).toEqual(["E1", "E2"]);
    expect(systemMarkdown).toContain("Faits mesurés par le produit");
    expect(systemMarkdown).toContain("Conduite mesurée par le produit");
  });

  it("ne mesure rien quand le commercial n'est que deviné à l'ordre de parole, et le dit", async () => {
    const { result, systemMarkdown } = await analyse(null);
    expect(result.speakers).toBe("guessed");
    expect(result.criteria).toEqual([]);
    expect(systemMarkdown).not.toContain("Faits mesurés par le produit");
    expect(systemMarkdown).not.toContain("Conduite mesurée par le produit");
  });

  it("dit quand le transcript ne distingue pas ses intervenants", async () => {
    const deps = harness("Camille Roux");
    deps.meetings.findMeetingByIdForOrg.mockResolvedValue({
      id: "m1",
      organizationId: "org_1",
      transcript:
        "Bonjour et merci de me recevoir. Nous sommes douze commerciaux sur deux régions et les remises partent trop vite.",
      notes: null,
      meetingType: "RDV découverte",
      pipelineStage: null,
      prospectName: "Hélène Marchand",
      sellerName: "Camille Roux",
    });
    const out = await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SCORECARD",
    });
    expect(out).toEqual({ ok: true, analysisId: "a1" });
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      result: { speakers: string; gridId: string };
    };
    expect(persiste.result.speakers).toBe("none");
    expect(persiste.result.gridId).toBe(DEFAULT_SCORECARD_GRID.id);
  });
});
