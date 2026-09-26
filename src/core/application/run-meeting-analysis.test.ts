import { describe, expect, it } from "@jest/globals";
import {
  KISS_SELLER_SKILLS_INSTRUCTION,
  withDiscSystemPrompt,
  withKissSystemPrompt,
  withScorecardSystemPrompt,
  withSoncasSystemPrompt,
} from "@/lib/ai-system-prompt";
import { coachingScoreScaleInstruction } from "@/src/core/domain/coaching-score-scale";
import {
  discScoreScaleInstruction,
  PROFILE_SCORE_UNPROVEN_MAX,
  soncasScoreScaleInstruction,
} from "@/src/core/domain/profile-score-scale";
import {
  DEFAULT_SCORECARD_GRID,
  scorecardCriteria,
} from "@/src/core/domain/scorecard-grid";
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
      analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
          analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
      analyzeObjections: jest.fn(),
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
          analyzeObjections: jest.fn(),
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

describe("runMeetingAnalysis : prompt système composé", () => {
  const PLAYBOOK = "## Playbook de l'organisation\n\n### Offre\n\nDu conseil.";

  function harness(kind: "SONCAS" | "DISC" | "KISS") {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a1",
        meetingId: "m1",
        kind,
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
        kind,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn().mockResolvedValue({ result: {} }),
      analyzeDisc: jest.fn().mockResolvedValue({ result: {} }),
      analyzeKiss: jest.fn().mockResolvedValue({ result: {} }),
    };
    return { meetings, prompts, analysis };
  }

  function systemMarkdownSentFor(
    analysis: ReturnType<typeof harness>["analysis"],
    kind: "SONCAS" | "DISC" | "KISS",
  ): string {
    const fn =
      kind === "SONCAS"
        ? analysis.analyzeSoncas
        : kind === "DISC"
          ? analysis.analyzeDisc
          : analysis.analyzeKiss;
    return (fn.mock.calls[0][0] as { systemMarkdown: string }).systemMarkdown;
  }

  it.each(["SONCAS", "DISC", "KISS"] as const)(
    "envoie le prompt de base inchangé à %s sans playbook",
    async (kind) => {
      /*
        Garde-fou de non-régression : une organisation qui n'a rien renseigné
        doit recevoir exactement le prompt d'avant le playbook.
      */
      const { meetings, prompts, analysis } = harness(kind);
      await runMeetingAnalysis({ meetings, prompts, analysis } as never, {
        organizationId: "org_1",
        meetingId: "m1",
        kind,
      });
      expect(systemMarkdownSentFor(analysis, kind)).toBe("base");
    },
  );

  it.each(["SONCAS", "DISC", "KISS"] as const)(
    "colle le playbook au prompt %s",
    async (kind) => {
      const { meetings, prompts, analysis } = harness(kind);
      await runMeetingAnalysis({ meetings, prompts, analysis } as never, {
        organizationId: "org_1",
        meetingId: "m1",
        kind,
        organizationPlaybookMarkdown: PLAYBOOK,
      });
      expect(systemMarkdownSentFor(analysis, kind)).toBe(
        `base\n\n---\n\n${PLAYBOOK}`,
      );
    },
  );

  it.each(["SONCAS", "DISC", "KISS"] as const)(
    "ignore un playbook vide pour %s",
    async (kind) => {
      const { meetings, prompts, analysis } = harness(kind);
      await runMeetingAnalysis({ meetings, prompts, analysis } as never, {
        organizationId: "org_1",
        meetingId: "m1",
        kind,
        organizationPlaybookMarkdown: "   \n\t ",
      });
      expect(systemMarkdownSentFor(analysis, kind)).toBe("base");
    },
  );

  it("garde la forme historique du bloc KISS plateforme", async () => {
    const { meetings, prompts, analysis } = harness("KISS");
    await runMeetingAnalysis({ meetings, prompts, analysis } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "KISS",
      kissSystemMarkdownAppendix: "  consigne  ",
    });
    expect(systemMarkdownSentFor(analysis, "KISS")).toBe(
      "base\n\n---\n\n## Consignes KISS (plateforme)\n\nconsigne",
    );
  });

  it("place le playbook après les consignes KISS de la plateforme", async () => {
    /*
      L'ordre compte : les consignes de la plateforme cadrent la méthode
      d'analyse, le playbook décrit l'entreprise analysée. Le contexte le plus
      spécifique vient en dernier, au plus près de la tâche.
    */
    const { meetings, prompts, analysis } = harness("KISS");
    await runMeetingAnalysis({ meetings, prompts, analysis } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "KISS",
      kissSystemMarkdownAppendix: "consigne",
      organizationPlaybookMarkdown: PLAYBOOK,
    });
    expect(systemMarkdownSentFor(analysis, "KISS")).toBe(
      `base\n\n---\n\n## Consignes KISS (plateforme)\n\nconsigne\n\n---\n\n${PLAYBOOK}`,
    );
  });

  it("journalise le prompt réellement composé", async () => {
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const { meetings, prompts, analysis } = harness("SONCAS");
    await runMeetingAnalysis({ meetings, prompts, analysis, aiLogs } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SONCAS",
      organizationPlaybookMarkdown: PLAYBOOK,
    });
    const logged = aiLogs.createLog.mock.calls[0][0] as {
      systemPrompt: string;
    };
    expect(logged.systemPrompt).toContain(PLAYBOOK);
  });

  it("journalise pour KISS le texte que l'adaptateur envoie vraiment", async () => {
    /*
      La trace était composée avec l'enrobage générique alors que l'adaptateur
      applique l'enrobage KISS. Le modèle recevait le bon texte ; c'est le
      journal qui mentait, en omettant la définition des six notes et l'échelle
      du coachingScore. Or on ne va lire `AiRequestLog` que dans un cas : une
      note surprend et on cherche ce qui a été demandé.
    */
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const { meetings, prompts, analysis } = harness("KISS");
    await runMeetingAnalysis({ meetings, prompts, analysis, aiLogs } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "KISS",
      organizationPlaybookMarkdown: PLAYBOOK,
    });
    const logged = aiLogs.createLog.mock.calls[0][0] as {
      systemPrompt: string;
    };
    expect(logged.systemPrompt).toBe(
      withKissSystemPrompt(systemMarkdownSentFor(analysis, "KISS")),
    );
    expect(logged.systemPrompt).toContain(KISS_SELLER_SKILLS_INSTRUCTION);
    expect(logged.systemPrompt).toContain(coachingScoreScaleInstruction());
  });

  /*
    Le même piège que pour KISS, et il vient de se rouvrir : SONCAS et DISC ont
    désormais chacun leur enrobage, appliqué par l'adaptateur. Composer la trace
    avec l'enrobage générique donnerait un journal qui décrit une consigne sans
    échelle, alors que le modèle en a reçu une, c'est-à-dire pire qu'un journal
    absent, puisqu'on ne le relit que pour comprendre une note surprenante.
  */
  it("journalise pour SONCAS le texte que l'adaptateur envoie vraiment", async () => {
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const { meetings, prompts, analysis } = harness("SONCAS");
    await runMeetingAnalysis({ meetings, prompts, analysis, aiLogs } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SONCAS",
      organizationPlaybookMarkdown: PLAYBOOK,
    });
    const logged = aiLogs.createLog.mock.calls[0][0] as {
      systemPrompt: string;
    };
    expect(logged.systemPrompt).toBe(
      withSoncasSystemPrompt(systemMarkdownSentFor(analysis, "SONCAS")),
    );
    expect(logged.systemPrompt).toContain(soncasScoreScaleInstruction());
    expect(logged.systemPrompt).not.toContain(discScoreScaleInstruction());
  });

  it("journalise pour DISC le texte que l'adaptateur envoie vraiment", async () => {
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    const { meetings, prompts, analysis } = harness("DISC");
    await runMeetingAnalysis({ meetings, prompts, analysis, aiLogs } as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "DISC",
      organizationPlaybookMarkdown: PLAYBOOK,
    });
    const logged = aiLogs.createLog.mock.calls[0][0] as {
      systemPrompt: string;
    };
    expect(logged.systemPrompt).toBe(
      withDiscSystemPrompt(systemMarkdownSentFor(analysis, "DISC")),
    );
    expect(logged.systemPrompt).toContain(discScoreScaleInstruction());
    expect(logged.systemPrompt).not.toContain(soncasScoreScaleInstruction());
  });
});

/*
  « Pas de preuve, pas de note », vu depuis l'application. La règle elle-même est
  couverte dans `soncas-evidence-rule.test.ts` ; ce qui se joue ici, c'est
  qu'elle soit branchée du bon côté : après le journal, avant l'enregistrement,
  et sur SONCAS seulement.
*/
describe("runMeetingAnalysis : verbatim obligatoire sur SONCAS", () => {
  /**
   * Ce que rendrait un modèle qui pose un levier haut sans rien pour l'appuyer.
   *
   * Confort est appuyé et monte à 70 : sans lui, Argent ramené à 19 resterait le
   * mieux noté des six et le dominant ne bougerait pas, si bien que le test ne
   * dirait rien de la façon dont on le recalcule.
   */
  function soncasSansPreuveSurArgent() {
    const plancher = { score: 10, evidence: ["on l a entendu"] };
    return {
      drivers: {
        securite: plancher,
        orgueil: plancher,
        nouveaute: plancher,
        confort: { score: 70, evidence: ["je veux que ca roule tout seul"] },
        argent: { score: 90, evidence: [] },
        sympathie: plancher,
      },
      dominant: "argent" as const,
      summary: "Un prospect qui compte.",
    };
  }

  function harness(kind: "SONCAS" | "DISC", resultatRendu: unknown) {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a1",
        meetingId: "m1",
        kind,
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
        kind,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn().mockResolvedValue({ result: resultatRendu }),
      analyzeDisc: jest.fn().mockResolvedValue({ result: resultatRendu }),
      analyzeKiss: jest.fn(),
      analyzeObjections: jest.fn(),
    };
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    return { meetings, prompts, analysis, aiLogs };
  }

  it("enregistre le levier sans preuve ramené au seuil", async () => {
    const deps = harness("SONCAS", soncasSansPreuveSurArgent());
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SONCAS",
    });
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      result: { drivers: Record<string, { score: number }>; dominant: string };
    };
    expect(persiste.result.drivers.argent?.score).toBe(
      PROFILE_SCORE_UNPROVEN_MAX,
    );
    expect(persiste.result.dominant).toBe("confort");
  });

  /*
    Le journal garde ce que le modèle a rendu, pas ce que le produit en a fait.
    C'est la seule trace où l'on puisse constater qu'un 90 avait été annoncé sans
    citation : la fiche, elle, ne montrera plus que le 19, et un journal corrigé
    en même temps qu'elle rendrait la correction invisible partout.
  */
  it("laisse dans le journal la note que le modèle avait annoncée", async () => {
    const deps = harness("SONCAS", soncasSansPreuveSurArgent());
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SONCAS",
    });
    const logged = deps.aiLogs.createLog.mock.calls[0][0] as {
      rawOutput: { drivers: Record<string, { score: number }> };
    };
    expect(logged.rawOutput.drivers.argent?.score).toBe(90);
  });

  it("n'applique aucune correction à un SONCAS entièrement appuyé", async () => {
    const rendu = {
      ...soncasSansPreuveSurArgent(),
      drivers: {
        ...soncasSansPreuveSurArgent().drivers,
        argent: { score: 90, evidence: ["c est trop cher"] },
      },
    };
    const deps = harness("SONCAS", rendu);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SONCAS",
    });
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      result: unknown;
    };
    expect(persiste.result).toBe(rendu);
  });

  /*
    DISC passe sans correction, et pas par oubli : son schéma porte une seule
    liste `evidence` pour quatre styles, si bien qu'aucune preuve n'est
    rattachable à une note en particulier. Une règle automatique y jetterait les
    quatre notes dès que la liste est vide, ou n'en jetterait aucune.
  */
  it("enregistre le résultat DISC tel que le modèle l'a rendu", async () => {
    const rendu = {
      scores: { D: 80, I: 20, S: 20, C: 20 },
      dominant: "D" as const,
      evidence: [],
      summary: "Direct.",
    };
    const deps = harness("DISC", rendu);
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "DISC",
    });
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      result: unknown;
    };
    expect(persiste.result).toBe(rendu);
  });
});

describe("runMeetingAnalysis : scorecard", () => {
  /** Tous les critères au niveau 2, ce que le modèle rendrait. */
  function niveauxUniformes(level: number) {
    return scorecardCriteria(DEFAULT_SCORECARD_GRID).map((criterion) => ({
      key: criterion.key,
      level,
      evidence: ["extrait"],
    }));
  }

  /**
   * Ce que le modèle rend, et rien de plus : aucun total.
   *
   * Le schéma de génération n'en réclame pas, et ces tests se donneraient une
   * facilité en en fournissant un. Le score attendu se calcule donc à la main
   * dans chaque test, depuis les poids de la grille.
   */
  function resultatSimule(level: number) {
    return {
      criteria: niveauxUniformes(level),
      pointsLost: [],
      keep: [],
      improve: [],
      stop: [],
      goldenQuestion: "Q",
      challenge: "C",
      summary: "S",
    };
  }

  function harness(options?: {
    meetingType?: string | null;
    result?: unknown;
    rejette?: boolean;
  }) {
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
        meetingType: options?.meetingType ?? "RDV découverte",
        pipelineStage: null,
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
        kind: "SCORECARD" as const,
        version: 3,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analyzeScorecard = options?.rejette
      ? jest.fn().mockRejectedValue(new Error("boom"))
      : jest
          .fn()
          .mockResolvedValue({ result: options?.result ?? resultatSimule(2) });
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
      analyzeObjections: jest.fn(),
      analyzeScorecard,
    };
    const aiLogs = { createLog: jest.fn().mockResolvedValue(undefined) };
    return { meetings, prompts, analysis, aiLogs };
  }

  function lancer(deps: ReturnType<typeof harness>) {
    return runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SCORECARD",
    });
  }

  /*
    Le score est calculé ici, pas rendu par le modèle : 50 est vérifiable à la
    main. Chaque bloc pèse le double de son nombre de critères, et des critères
    tous notés à la moitié de l'échelle donnent à chaque bloc la moitié de son
    poids, donc la moitié des cent points.
  */
  it("enregistre les niveaux du modèle et le score que le produit calcule", async () => {
    const deps = harness();
    const result = await lancer(deps);

    expect(result).toEqual({ ok: true, analysisId: "a1" });
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      kind: string;
      promptVersionId: string;
      result: {
        gridId: string;
        gridName: string;
        overallScore: number;
        blocks: { key: string; score: number; max: number }[];
        criteria: unknown[];
      };
    };
    expect(persiste.kind).toBe("SCORECARD");
    expect(persiste.promptVersionId).toBe("pv");
    expect(persiste.result.gridId).toBe(DEFAULT_SCORECARD_GRID.id);
    expect(persiste.result.gridName).toBe(DEFAULT_SCORECARD_GRID.name);
    expect(persiste.result.overallScore).toBe(50);
    expect(persiste.result.blocks.map((b) => [b.key, b.score, b.max])).toEqual(
      DEFAULT_SCORECARD_GRID.blocks.map((b) => [b.key, b.weight / 2, b.weight]),
    );
    expect(persiste.result.criteria).toHaveLength(
      scorecardCriteria(DEFAULT_SCORECARD_GRID).length,
    );
  });

  /*
    Le schéma de génération n'a pas de champ `overallScore`, et l'adaptateur le
    ferait tomber avant d'arriver ici. Reste le jour où quelqu'un l'y remet :
    le total du produit doit gagner, sans quoi le chiffre affiché ne serait plus
    celui que la grille donne aux niveaux enregistrés juste à côté.
  */
  it("ignore un total que le modèle aurait rendu quand même", async () => {
    const deps = harness({
      result: { ...resultatSimule(2), overallScore: 999, blocks: [] },
    });
    await lancer(deps);
    const persiste = deps.meetings.createAnalysis.mock.calls[0][0] as {
      result: { overallScore: number; blocks: unknown[] };
    };
    expect(persiste.result.overallScore).toBe(50);
    expect(persiste.result.blocks).toHaveLength(
      DEFAULT_SCORECARD_GRID.blocks.length,
    );
  });

  /*
    Un closing n'a pas encore de grille. Le noter sur celle de découverte lui
    reprocherait de n'avoir pas fait le travail d'un premier rendez-vous ; ce
    score faux irait ensuite dans des moyennes. L'issue est donc distincte d'un
    échec, et rien n'est ni demandé au modèle ni enregistré.
  */
  it("ne note pas un type de rendez-vous sans grille", async () => {
    const deps = harness({ meetingType: "Closing" });
    const result = await lancer(deps);

    expect(result).toEqual({ ok: false, error: "NO_SCORECARD_GRID" });
    expect(deps.analysis.analyzeScorecard).not.toHaveBeenCalled();
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
    expect(deps.aiLogs.createLog).not.toHaveBeenCalled();
  });

  it("applique la grille par défaut à un rendez-vous sans type ni étape", async () => {
    const deps = harness({ meetingType: null });
    const result = await lancer(deps);

    expect(result).toEqual({ ok: true, analysisId: "a1" });
    const appel = deps.analysis.analyzeScorecard.mock.calls[0][0] as {
      grid: { id: string };
    };
    expect(appel.grid.id).toBe(DEFAULT_SCORECARD_GRID.id);
  });

  it("colle le playbook de l'organisation à la consigne éditable", async () => {
    const deps = harness();
    const playbook =
      "## Playbook de l'organisation\n\n### Offre\n\nDu conseil.";
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SCORECARD",
      organizationPlaybookMarkdown: playbook,
    });
    const appel = deps.analysis.analyzeScorecard.mock.calls[0][0] as {
      systemMarkdown: string;
    };
    expect(appel.systemMarkdown).toBe(`base\n\n---\n\n${playbook}`);
  });

  /*
    Le bloc de consignes KISS de la plateforme parle des six notes du commercial
    et du coachingScore, deux champs que la scorecard ne produit pas. Il est
    passé par le même appelant pour toutes les analyses ; qu'il ne parte pas ici
    est une décision, et non un oubli qui tiendrait à l'ordre des arguments.
  */
  it("n'envoie pas les consignes KISS de la plateforme", async () => {
    const deps = harness();
    await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "SCORECARD",
      kissSystemMarkdownAppendix: "CONSIGNE KISS PLATEFORME",
    });
    const appel = deps.analysis.analyzeScorecard.mock.calls[0][0] as {
      systemMarkdown: string;
    };
    expect(appel.systemMarkdown).toBe("base");
  });

  /*
    Même discipline que pour KISS : le journal doit porter le texte que
    l'adaptateur envoie vraiment, grille comprise. C'est le seul endroit où l'on
    va chercher pourquoi un critère a été noté comme il l'a été.
  */
  it("journalise la consigne complète, grille du rendez-vous comprise", async () => {
    const deps = harness();
    await lancer(deps);
    const logged = deps.aiLogs.createLog.mock.calls[0][0] as {
      kind: string;
      status: string;
      promptVersion: string;
      systemPrompt: string;
      rawOutput: { overallScore?: number };
    };
    expect(logged.kind).toBe("SCORECARD");
    expect(logged.status).toBe("SUCCESS");
    expect(logged.promptVersion).toBe("3");
    expect(logged.systemPrompt).toBe(
      withScorecardSystemPrompt("base", DEFAULT_SCORECARD_GRID),
    );
    // Le journal garde ce que le modèle a rendu, pas le total du produit.
    expect(logged.rawOutput.overallScore).toBeUndefined();
  });

  it("remonte un échec du modèle et le journalise", async () => {
    const deps = harness({ rejette: true });
    const result = await lancer(deps);

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
    });
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
    const logged = deps.aiLogs.createLog.mock.calls[0][0] as {
      status: string;
      errorMessage: string;
    };
    expect(logged.status).toBe("ERROR");
    expect(logged.errorMessage).toBe("boom");
  });

  /*
    Le typage dit que seul KISS peut arriver jusqu'à la fin de l'aiguillage, et
    il le dit sur une promesse que personne ne tient : le dépôt Prisma relit
    `kind` depuis la base et le convertit sans contrôle. Les deux tests qui
    suivent disent où chaque garde-fou sert.

    Un nom qui n'existe nulle part est arrêté bien avant, faute de consigne par
    défaut à ce nom : c'est la première ligne de défense, et elle suffit.
  */
  it("s'arrête sur une analyse dont aucune consigne ne porte le nom", async () => {
    const deps = harness();
    const result = await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "CLOSING_SCORECARD" as never,
    });

    expect(result).toEqual({ ok: false, error: "PROMPT_NOT_CONFIGURED" });
    expect(deps.analysis.analyzeKiss).not.toHaveBeenCalled();
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
  });

  /*
    Le cas qui justifie le garde-fou, et le seul : une analyse qui a bien une
    consigne livrée passe la première ligne de défense. C'est exactement la
    forme qu'aurait l'oubli, le jour où le closing arrive avec sa consigne, sa
    grille et son onglet, mais sans sa branche d'aiguillage. Sans ce refus, ce
    rendez-vous partirait analysé en KISS et s'enregistrerait sous son propre
    nom : une ligne indiscernable d'une vraie, et fausse de bout en bout.
  */
  it("refuse une analyse dont la consigne existe mais pas le traitement", async () => {
    const deps = harness();
    const result = await runMeetingAnalysis(deps as never, {
      organizationId: "org_1",
      meetingId: "m1",
      kind: "FOLLOW_UP_EMAIL" as never,
    });

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "Analyse non prise en charge : FOLLOW_UP_EMAIL",
    });
    expect(deps.analysis.analyzeKiss).not.toHaveBeenCalled();
    expect(deps.meetings.createAnalysis).not.toHaveBeenCalled();
  });
});

describe("runMeetingAnalysis : objections", () => {
  /*
    Les objections passent par la même branche que SONCAS et DISC : rien que
    le transcript, l'enrobage générique, et le résultat enregistré tel quel.
    Le test tient à deux choses : l'appel part bien vers analyzeObjections et
    non vers un profil, et la ligne enregistrée porte le bon genre.
  */
  it("appelle analyzeObjections et enregistre le résultat sous OBJECTIONS", async () => {
    const result = {
      objections: [
        {
          objection: "On verra selon ce que vous proposez.",
          who: "Le prospect",
          moment: null,
          response: "Aucune relance.",
          effect: "L'objection n'est pas traitée.",
          outcome: "open",
          suggestion:
            "Reposez la question : « Ce serait quoi, dans les clous ? »",
        },
      ],
      summary: "Une objection, laissée ouverte.",
    };
    const meetings = {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org_1",
        transcript: "t",
        notes: null,
        meetingType: null,
        pipelineStage: null,
      }),
      createAnalysis: jest.fn().mockResolvedValue({
        id: "a-obj",
        meetingId: "m1",
        kind: "OBJECTIONS",
        model: "m",
        result,
        createdAt: new Date(),
      }),
      findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
    };
    const prompts = {
      ensureCurrentVersion: jest.fn().mockResolvedValue({
        id: "pv",
        markdown: "base",
        templateId: "t",
        kind: "OBJECTIONS" as const,
        version: 1,
        authorUserId: "u1",
        createdAt: new Date(),
      }),
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    };
    const analysis = {
      analyzeSoncas: jest.fn(),
      analyzeDisc: jest.fn(),
      analyzeKiss: jest.fn(),
      analyzeScorecard: jest.fn(),
      analyzeObjections: jest.fn().mockResolvedValue({ result }),
    };

    const out = await runMeetingAnalysis(
      { meetings, prompts, analysis } as never,
      { organizationId: "org_1", meetingId: "m1", kind: "OBJECTIONS" },
    );

    expect(out).toEqual({ ok: true, analysisId: "a-obj" });
    expect(analysis.analyzeObjections).toHaveBeenCalledTimes(1);
    expect(analysis.analyzeSoncas).not.toHaveBeenCalled();
    expect(analysis.analyzeDisc).not.toHaveBeenCalled();
    expect(meetings.createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "OBJECTIONS", result }),
    );
  });
});
