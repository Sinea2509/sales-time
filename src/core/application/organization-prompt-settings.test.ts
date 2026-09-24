import { describe, expect, it } from "@jest/globals";
import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import {
  ORGANIZATION_PROMPT_EMPTY_MESSAGE,
  ORGANIZATION_PROMPT_KINDS,
  ORGANIZATION_PROMPT_MAX_CHARS,
  ORGANIZATION_PROMPT_TOO_LONG_MESSAGE,
} from "@/src/core/domain/organization-prompts";
import type { PromptTemplateVersionRow } from "@/src/core/ports/prompt-template-repository-port";
import {
  loadOrganizationPromptCards,
  resetOrganizationPrompt,
  saveOrganizationPrompt,
} from "./organization-prompt-settings";
import { inMemoryOrganizationPrompts } from "./testing/in-memory-organization-prompts";

/** Le super admin a publié SONCAS en version 4, et rien d'autre. */
function prompts() {
  return {
    getCurrentVersion: jest.fn(
      async ({
        kind,
      }: {
        kind: string;
      }): Promise<PromptTemplateVersionRow | null> =>
        kind === "SONCAS"
          ? {
              id: "pv_soncas",
              templateId: "t",
              kind: "SONCAS",
              version: 4,
              markdown: "SONCAS du super admin",
              authorUserId: "super_admin",
              createdAt: new Date("2026-09-24T08:00:00.000Z"),
            }
          : null,
    ),
  };
}

function audit() {
  return { logPlatformAction: jest.fn().mockResolvedValue(undefined) };
}

describe("loadOrganizationPromptCards", () => {
  it("montre les six consignes d'origine avant toute modification", async () => {
    const cards = await loadOrganizationPromptCards(
      {
        prompts: prompts() as never,
        organizationPrompts: inMemoryOrganizationPrompts(),
      },
      { organizationId: "org_a" },
    );

    expect(cards.map((card) => card.kind)).toEqual([
      ...ORGANIZATION_PROMPT_KINDS,
    ]);
    expect(cards.every((card) => card.modified === null)).toBe(true);
    const soncas = cards.find((card) => card.kind === "SONCAS");
    expect(soncas).toEqual({
      kind: "SONCAS",
      markdown: "SONCAS du super admin",
      originVersion: 4,
      modified: null,
    });
    const disc = cards.find((card) => card.kind === "DISC");
    expect(disc).toEqual({
      kind: "DISC",
      markdown: DEFAULT_ANALYSIS_PROMPT_MARKDOWN.DISC,
      originVersion: null,
      modified: null,
    });
  });

  it("montre la consigne modifiée, sa date et son auteur", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      {
        organizationId: "org_a",
        kind: "SONCAS",
        markdown: "SONCAS de A",
        authorName: "Claire Morel",
      },
    ]);
    const cards = await loadOrganizationPromptCards(
      { prompts: prompts() as never, organizationPrompts },
      { organizationId: "org_a" },
    );

    expect(cards.find((card) => card.kind === "SONCAS")).toEqual({
      kind: "SONCAS",
      markdown: "SONCAS de A",
      originVersion: 4,
      modified: {
        at: organizationPrompts.rows[0].createdAt,
        authorName: "Claire Morel",
      },
    });
  });

  it("revient à la consigne d'origine après une réinitialisation", async () => {
    const cards = await loadOrganizationPromptCards(
      {
        prompts: prompts() as never,
        organizationPrompts: inMemoryOrganizationPrompts([
          { organizationId: "org_a", kind: "SONCAS", markdown: "SONCAS de A" },
          { organizationId: "org_a", kind: "SONCAS", markdown: null },
        ]),
      },
      { organizationId: "org_a" },
    );

    const soncas = cards.find((card) => card.kind === "SONCAS");
    expect(soncas?.modified).toBeNull();
    expect(soncas?.markdown).toBe("SONCAS du super admin");
  });

  it("ne montre pas les consignes d'une autre organisation", async () => {
    const cards = await loadOrganizationPromptCards(
      {
        prompts: prompts() as never,
        organizationPrompts: inMemoryOrganizationPrompts([
          { organizationId: "org_b", kind: "KISS", markdown: "KISS de B" },
        ]),
      },
      { organizationId: "org_a" },
    );

    const kiss = cards.find((card) => card.kind === "KISS");
    expect(kiss?.modified).toBeNull();
    expect(kiss?.markdown).toBe(DEFAULT_ANALYSIS_PROMPT_MARKDOWN.KISS);
  });
});

describe("saveOrganizationPrompt", () => {
  const base = { organizationId: "org_a", actorUserId: "manager_a" };

  it("ajoute une version et l'inscrit au journal d'audit", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts();
    const journal = audit();

    const result = await saveOrganizationPrompt(
      { prompts: prompts() as never, organizationPrompts, audit: journal },
      { ...base, kind: "SONCAS", markdown: "  SONCAS de A\n" },
    );

    expect(result).toEqual({ ok: true, changed: true });
    expect(organizationPrompts.rows).toEqual([
      expect.objectContaining({
        organizationId: "org_a",
        kind: "SONCAS",
        markdown: "SONCAS de A",
        authorUserId: "manager_a",
      }),
    ]);
    expect(journal.logPlatformAction).toHaveBeenCalledWith({
      actorUserId: "manager_a",
      organizationId: "org_a",
      action: "ORG_PROMPT_UPDATED",
      reason: "SONCAS : nouvelle version de la consigne (11 caractères)",
    });
  });

  it("refuse une consigne vide ou trop longue, sans rien écrire", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts();
    const journal = audit();
    const deps = {
      prompts: prompts() as never,
      organizationPrompts,
      audit: journal,
    };

    expect(
      await saveOrganizationPrompt(deps, {
        ...base,
        kind: "DISC",
        markdown: "   ",
      }),
    ).toEqual({ ok: false, message: ORGANIZATION_PROMPT_EMPTY_MESSAGE });
    expect(
      await saveOrganizationPrompt(deps, {
        ...base,
        kind: "DISC",
        markdown: "a".repeat(ORGANIZATION_PROMPT_MAX_CHARS + 1),
      }),
    ).toEqual({ ok: false, message: ORGANIZATION_PROMPT_TOO_LONG_MESSAGE });
    expect(organizationPrompts.rows).toHaveLength(0);
    expect(journal.logPlatformAction).not.toHaveBeenCalled();
  });

  it("refuse une consigne qui reste globale", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts();
    const result = await saveOrganizationPrompt(
      { prompts: prompts() as never, organizationPrompts, audit: audit() },
      { ...base, kind: "MEETING_BRIEFING", markdown: "briefing" },
    );

    expect(result).toEqual({
      ok: false,
      message: "Cette consigne ne se règle pas par organisation.",
    });
    expect(organizationPrompts.rows).toHaveLength(0);
  });

  it("n'ajoute rien quand le texte est celui déjà en vigueur", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_a", kind: "KISS", markdown: "KISS de A" },
    ]);
    const journal = audit();
    const deps = {
      prompts: prompts() as never,
      organizationPrompts,
      audit: journal,
    };

    // La consigne d'origine, enregistrée telle quelle : elle ne doit pas se figer.
    expect(
      await saveOrganizationPrompt(deps, {
        ...base,
        kind: "SONCAS",
        markdown: "SONCAS du super admin",
      }),
    ).toEqual({ ok: true, changed: false });
    // La consigne de l'organisation, enregistrée à nouveau.
    expect(
      await saveOrganizationPrompt(deps, {
        ...base,
        kind: "KISS",
        markdown: "KISS de A\n",
      }),
    ).toEqual({ ok: true, changed: false });
    expect(organizationPrompts.rows).toHaveLength(1);
    expect(journal.logPlatformAction).not.toHaveBeenCalled();
  });
});

describe("resetOrganizationPrompt", () => {
  const base = { organizationId: "org_a", actorUserId: "manager_a" };

  it("ajoute une ligne sans texte et l'inscrit au journal d'audit", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_a", kind: "SONCAS", markdown: "SONCAS de A" },
    ]);
    const journal = audit();

    const result = await resetOrganizationPrompt(
      { organizationPrompts, audit: journal },
      { ...base, kind: "SONCAS" },
    );

    expect(result).toEqual({ ok: true, changed: true });
    expect(organizationPrompts.rows).toHaveLength(2);
    expect(organizationPrompts.rows[1]).toEqual(
      expect.objectContaining({ markdown: null, authorUserId: "manager_a" }),
    );
    // La version du manager reste dans l'historique.
    expect(organizationPrompts.rows[0].markdown).toBe("SONCAS de A");
    expect(journal.logPlatformAction).toHaveBeenCalledWith({
      actorUserId: "manager_a",
      organizationId: "org_a",
      action: "ORG_PROMPT_RESET",
      reason: "SONCAS : consigne d'origine rétablie",
    });
  });

  it("ne fait rien sur une consigne déjà d'origine", async () => {
    const organizationPrompts = inMemoryOrganizationPrompts([
      { organizationId: "org_b", kind: "SONCAS", markdown: "SONCAS de B" },
    ]);
    const journal = audit();

    const result = await resetOrganizationPrompt(
      { organizationPrompts, audit: journal },
      { ...base, kind: "SONCAS" },
    );

    expect(result).toEqual({ ok: true, changed: false });
    expect(organizationPrompts.rows).toHaveLength(1);
    expect(journal.logPlatformAction).not.toHaveBeenCalled();
  });

  it("refuse une consigne qui reste globale", async () => {
    const result = await resetOrganizationPrompt(
      { organizationPrompts: inMemoryOrganizationPrompts(), audit: audit() },
      { ...base, kind: "TEAM_COACHING" },
    );
    expect(result.ok).toBe(false);
  });
});
