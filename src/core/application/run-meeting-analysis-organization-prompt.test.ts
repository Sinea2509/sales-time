import { describe, expect, it } from "@jest/globals";
import {
  DISC_MOMENTS_INSTRUCTION,
  SONCAS_MOMENTS_INSTRUCTION,
  FRENCH_TYPOGRAPHY_INSTRUCTION,
  KISS_SELLER_SKILLS_INSTRUCTION,
} from "@/lib/ai-system-prompt";
import type { OrganizationPromptKind } from "@/src/core/domain/organization-prompts";
import {
  DEFAULT_SCORECARD_GRID,
  scorecardCriteria,
} from "@/src/core/domain/scorecard-grid";
import { runMeetingAnalysis } from "./run-meeting-analysis";
import { inMemoryOrganizationPrompts } from "./testing/in-memory-organization-prompts";

/**
 * Une analyse lancée avec une consigne d'organisation.
 *
 * Ce que ces tests tiennent : la consigne de l'organisation part au modèle à
 * la place de celle du super admin, et seulement pour cette organisation ;
 * les enrobages du produit (échelles, grille, compétences du commercial)
 * l'entourent comme ils entouraient l'autre ; l'analyse enregistrée et le
 * journal des appels disent quelle consigne a servi.
 */

const SUPER_ADMIN_TEXT = "Consigne du super admin, version 4.";
const ORG_TEXT =
  "Consigne de l'organisation A : parle comme un coach de terrain.";

function soncasResult() {
  const plancher = { score: 10, evidence: ["on en parle"] };
  return {
    drivers: {
      securite: plancher,
      orgueil: plancher,
      nouveaute: plancher,
      confort: plancher,
      argent: { score: 60, evidence: ["c'est trop cher"] },
      sympathie: plancher,
    },
    dominant: "argent" as const,
    summary: "Le prix revient souvent.",
  };
}

function scorecardResult() {
  return {
    criteria: scorecardCriteria(DEFAULT_SCORECARD_GRID).map((criterion) => ({
      key: criterion.key,
      explored: "aborde",
      obtained: "partiel",
      learned: "",
      missing: "",
      observable: true,
      evidence: [{ who: "prospect", quote: "on en parle" }],
    })),
    pointsLost: [],
    keep: [],
    improve: [],
    stop: [],
    goldenQuestion: "q",
    challenge: "c",
    summary: "s",
  };
}

function harness(
  rows: ReadonlyArray<{
    organizationId: string;
    kind: OrganizationPromptKind;
    markdown: string | null;
  }>,
) {
  const meetings = {
    findMeetingByIdForOrg: jest.fn(
      async ({ organizationId }: { organizationId: string }) => ({
        id: "m1",
        organizationId,
        transcript: "Oui, on en parle. Mais c'est trop cher pour nous.",
        notes: null,
        meetingType: "RDV découverte",
        pipelineStage: null,
      }),
    ),
    createAnalysis: jest.fn().mockResolvedValue({ id: "a1" }),
    findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
  };
  const prompts = {
    ensureCurrentVersion: jest.fn(async ({ kind }: { kind: string }) => ({
      id: "pv",
      templateId: "t",
      kind,
      version: 4,
      markdown: SUPER_ADMIN_TEXT,
      authorUserId: "super_admin",
      createdAt: new Date("2026-09-24T08:00:00.000Z"),
    })),
    getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
  };
  const analysis = {
    analyzeSoncas: jest.fn().mockResolvedValue({ result: soncasResult() }),
    analyzeDisc: jest.fn().mockResolvedValue({ result: {} }),
    analyzeKiss: jest.fn().mockResolvedValue({ result: {} }),
    analyzeScorecard: jest
      .fn()
      .mockResolvedValue({ result: scorecardResult() }),
  };
  const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
  return {
    meetings,
    prompts,
    organizationPrompts: inMemoryOrganizationPrompts(rows),
    analysis,
    aiLogs,
  };
}

type Deps = ReturnType<typeof harness>;

function logged(deps: Deps): { promptVersion: string; systemPrompt: string } {
  return deps.aiLogs.createLog.mock.calls[0][0] as {
    promptVersion: string;
    systemPrompt: string;
  };
}

function saved(deps: Deps): {
  promptVersionId: string;
  organizationPromptVersionId?: string | null;
} {
  return deps.meetings.createAnalysis.mock.calls[0][0] as {
    promptVersionId: string;
    organizationPromptVersionId?: string | null;
  };
}

describe("runMeetingAnalysis avec une consigne d'organisation", () => {
  it("envoie la consigne de l'organisation, entourée de l'échelle SONCAS du produit", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SONCAS", markdown: ORG_TEXT },
    ]);
    const result = await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });

    expect(result).toEqual({ ok: true, analysisId: "a1" });
    const sent = deps.analysis.analyzeSoncas.mock.calls[0][0] as {
      systemMarkdown: string;
    };
    expect(sent.systemMarkdown).toContain(ORG_TEXT);
    expect(sent.systemMarkdown).not.toContain(SUPER_ADMIN_TEXT);
    expect(logged(deps).systemPrompt).toContain(ORG_TEXT);
    expect(logged(deps).systemPrompt).toContain(SONCAS_MOMENTS_INSTRUCTION);
  });

  it("enregistre sur l'analyse la consigne d'organisation qui l'a produite", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SONCAS", markdown: ORG_TEXT },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });

    expect(saved(deps)).toEqual(
      expect.objectContaining({
        promptVersionId: "pv",
        organizationPromptVersionId: "opv_1",
      }),
    );
    expect(logged(deps).promptVersion).toBe("org:opv_1");
  });

  it("n'envoie jamais la consigne d'une organisation à une autre", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SONCAS", markdown: ORG_TEXT },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_b",
      meetingId: "m1",
      kind: "SONCAS",
    });

    const sent = deps.analysis.analyzeSoncas.mock.calls[0][0] as {
      systemMarkdown: string;
    };
    expect(sent.systemMarkdown).toContain(SUPER_ADMIN_TEXT);
    expect(sent.systemMarkdown).not.toContain(ORG_TEXT);
    expect(saved(deps).organizationPromptVersionId).toBeNull();
    expect(logged(deps).promptVersion).toBe("4");
  });

  it("revient à la consigne du super admin après une réinitialisation", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SONCAS", markdown: ORG_TEXT },
      { organizationId: "org_a", kind: "SONCAS", markdown: null },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });

    expect(logged(deps).systemPrompt).toContain(SUPER_ADMIN_TEXT);
    expect(logged(deps).systemPrompt).not.toContain(ORG_TEXT);
    expect(saved(deps).organizationPromptVersionId).toBeNull();
  });

  it("garde la grille du produit autour d'une consigne de scorecard modifiée", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SCORECARD", markdown: ORG_TEXT },
    ]);
    const result = await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SCORECARD",
    });

    expect(result).toEqual({ ok: true, analysisId: "a1" });
    const systemPrompt = logged(deps).systemPrompt;
    expect(systemPrompt).toContain(ORG_TEXT);
    for (const criterion of scorecardCriteria(DEFAULT_SCORECARD_GRID)) {
      expect(systemPrompt).toContain(criterion.label);
    }
    expect(saved(deps).organizationPromptVersionId).toBe("opv_1");
  });

  it("garde la consigne des compétences du commercial autour d'une consigne KISS modifiée", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "KISS", markdown: ORG_TEXT },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "KISS",
    });

    const systemPrompt = logged(deps).systemPrompt;
    expect(systemPrompt).toContain(ORG_TEXT);
    expect(systemPrompt).toContain(KISS_SELLER_SKILLS_INSTRUCTION);
    expect(saved(deps).organizationPromptVersionId).toBe("opv_1");
  });

  it("n'applique une consigne modifiée qu'au type pour lequel elle a été écrite", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "SONCAS", markdown: ORG_TEXT },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "DISC",
    });

    expect(logged(deps).systemPrompt).toContain(SUPER_ADMIN_TEXT);
    expect(logged(deps).systemPrompt).not.toContain(ORG_TEXT);
  });
  it("garde l'échelle DISC et la typographie autour d'une consigne DISC modifiée", async () => {
    const deps = harness([
      { organizationId: "org_a", kind: "DISC", markdown: ORG_TEXT },
    ]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "DISC",
    });

    const systemPrompt = logged(deps).systemPrompt;
    expect(systemPrompt).toContain(ORG_TEXT);
    expect(systemPrompt).toContain(DISC_MOMENTS_INSTRUCTION);
    expect(systemPrompt).toContain(FRENCH_TYPOGRAPHY_INSTRUCTION);
  });

  it("n'analyse pas avec la consigne d'origine quand la table ne se lit pas", async () => {
    const deps = harness([]);
    deps.organizationPrompts.findLatest = jest
      .fn()
      .mockRejectedValue(new Error("base indisponible"));

    const result = await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });

    /*
      Pas de repli silencieux : une analyse faite avec une autre consigne que
      celle de l'organisation serait fausse sans que personne le sache. La
      tâche échoue, et la reprise la relancera.
    */
    expect(result).toEqual({
      ok: false,
      error: "PROMPT_NOT_CONFIGURED",
      message: "base indisponible",
    });
    expect(deps.analysis.analyzeSoncas).not.toHaveBeenCalled();
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
  });

  it("laisse intactes les analyses faites avant l'enregistrement d'une consigne", async () => {
    const deps = harness([]);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });
    await deps.organizationPrompts.append({
      organizationId: "org_a",
      kind: "SONCAS",
      markdown: ORG_TEXT,
      authorUserId: "manager_a",
    });
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_a",
      meetingId: "m1",
      kind: "SONCAS",
    });

    // Une nouvelle analyse s'ajoute ; la précédente n'est ni relue ni réécrite.
    const calls = deps.meetings.createAnalysis.mock.calls.map(
      (call) =>
        (call[0] as { organizationPromptVersionId?: string | null })
          .organizationPromptVersionId,
    );
    expect(calls).toEqual([null, "opv_1"]);
    expect(Object.keys(deps.meetings)).toEqual([
      "findMeetingByIdForOrg",
      "createAnalysis",
      "findLatestAnalysisForMeeting",
    ]);
  });
});
