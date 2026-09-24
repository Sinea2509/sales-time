import { describe, expect, it } from "@jest/globals";
import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import type { PromptTemplateVersionRow } from "@/src/core/ports/prompt-template-repository-port";
import { resolveAnalysisPrompt } from "./resolve-analysis-prompt";
import { inMemoryOrganizationPrompts } from "./testing/in-memory-organization-prompts";

function globalVersion(
  kind: PromptTemplateVersionRow["kind"],
  markdown: string,
): PromptTemplateVersionRow {
  return {
    id: `pv_${kind}`,
    templateId: `t_${kind}`,
    kind,
    version: 4,
    markdown,
    authorUserId: "super_admin",
    createdAt: new Date("2026-09-24T08:00:00.000Z"),
  };
}

function prompts(current: PromptTemplateVersionRow | null) {
  return {
    getCurrentVersion: jest.fn().mockResolvedValue(current),
    ensureCurrentVersion: jest.fn().mockResolvedValue(current),
    getModelForKind: jest.fn(),
    updateModelForKind: jest.fn(),
    listVersions: jest.fn(),
    publishNewVersion: jest.fn(),
  };
}

describe("resolveAnalysisPrompt", () => {
  it("prend la consigne de l'organisation et en garde la trace", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_a", kind: "SONCAS", markdown: "SONCAS de A" },
    ]);
    const resolved = await resolveAnalysisPrompt(
      {
        prompts: prompts(globalVersion("SONCAS", "SONCAS du super admin")),
        organizationPrompts,
      },
      { kind: "SONCAS", organizationId: "org_a" },
    );
    expect(resolved).toEqual({
      markdown: "SONCAS de A",
      source: "organization",
      globalVersion: expect.objectContaining({ id: "pv_SONCAS", version: 4 }),
      organizationPromptVersionId: "opv_1",
    });
  });

  it("revient à la consigne du super admin après une réinitialisation", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_a", kind: "SONCAS", markdown: "SONCAS de A" },
      { organizationId: "org_a", kind: "SONCAS", markdown: null },
    ]);
    const resolved = await resolveAnalysisPrompt(
      {
        prompts: prompts(globalVersion("SONCAS", "SONCAS du super admin")),
        organizationPrompts,
      },
      { kind: "SONCAS", organizationId: "org_a" },
    );
    expect(resolved.markdown).toBe("SONCAS du super admin");
    expect(resolved.source).toBe("global");
    expect(resolved.organizationPromptVersionId).toBeNull();
  });

  it("revient à la consigne du code quand le super admin n'a rien publié", async () => {
    const resolved = await resolveAnalysisPrompt(
      {
        prompts: prompts(null),
        organizationPrompts: inMemoryOrganizationPrompts(),
      },
      { kind: "DISC", organizationId: "org_a" },
    );
    expect(resolved).toEqual({
      markdown: DEFAULT_ANALYSIS_PROMPT_MARKDOWN.DISC,
      source: "code",
      globalVersion: null,
      organizationPromptVersionId: null,
    });
  });

  it("ne sert jamais la consigne d'une organisation à une autre", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_a", kind: "KISS", markdown: "KISS de A" },
    ]);
    const deps = {
      prompts: prompts(globalVersion("KISS", "KISS du super admin")),
      organizationPrompts,
    };
    const pourA = await resolveAnalysisPrompt(deps, {
      kind: "KISS",
      organizationId: "org_a",
    });
    const pourB = await resolveAnalysisPrompt(deps, {
      kind: "KISS",
      organizationId: "org_b",
    });
    expect(pourA.markdown).toBe("KISS de A");
    expect(pourB.markdown).toBe("KISS du super admin");
    expect(pourB.organizationPromptVersionId).toBeNull();
  });

  it("ignore les lignes de l'organisation pour une consigne qui reste globale", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      /*
        L'écran ne permet pas d'écrire cette ligne ; elle figure ici comme une
        ligne égarée dans la table, que la résolution doit ignorer.
      */
      {
        organizationId: "org_a",
        kind: "MEETING_BRIEFING" as never,
        markdown: "briefing de A",
      },
    ]);
    const findLatest = jest.spyOn(organizationPrompts, "findLatest");
    const resolved = await resolveAnalysisPrompt(
      {
        prompts: prompts(globalVersion("MEETING_BRIEFING", "briefing global")),
        organizationPrompts,
      },
      { kind: "MEETING_BRIEFING", organizationId: "org_a" },
    );
    expect(resolved.markdown).toBe("briefing global");
    expect(findLatest).not.toHaveBeenCalled();
  });

  it("ne cherche aucune consigne d'organisation sans organisation", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts();
    const findLatest = jest.spyOn(organizationPrompts, "findLatest");
    await resolveAnalysisPrompt(
      { prompts: prompts(null), organizationPrompts },
      { kind: "SONCAS", organizationId: null },
    );
    expect(findLatest).not.toHaveBeenCalled();
  });

  it("crée au besoin la version du super admin pour une analyse, depuis la consigne du code", async () => {
    const deps = {
      prompts: prompts(globalVersion("SCORECARD", "grille globale")),
      organizationPrompts: inMemoryOrganizationPrompts(),
    };
    await resolveAnalysisPrompt(deps, {
      kind: "SCORECARD",
      organizationId: "org_a",
      ensureGlobalVersion: true,
    });
    expect(deps.prompts.ensureCurrentVersion).toHaveBeenCalledWith({
      kind: "SCORECARD",
      defaultMarkdown: DEFAULT_ANALYSIS_PROMPT_MARKDOWN.SCORECARD,
    });
    expect(deps.prompts.getCurrentVersion).not.toHaveBeenCalled();
  });
});
