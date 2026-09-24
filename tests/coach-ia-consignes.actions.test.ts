import { beforeEach, describe, expect, it } from "@jest/globals";
import type { OrganizationPromptVersionRow } from "@/src/core/ports/organization-prompt-repository-port";

/**
 * Les actions de Paramètres, Coach IA : qui peut enregistrer ou
 * réinitialiser une consigne, et pour quelle organisation.
 */

type JestFn = jest.Mock;

const ORG_ID = "clorg00000000000000000001";
const OTHER_ORG_ID = "clorg00000000000000000002";
const USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";

// eslint-disable-next-line no-var
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var loadOrgSettingsActorMock: JestFn;
jest.mock("@/lib/load-org-settings-access", () => {
  loadOrgSettingsActorMock = jest.fn();
  return { loadOrgSettingsActor: loadOrgSettingsActorMock };
});

// eslint-disable-next-line no-var
var rows: OrganizationPromptVersionRow[];
// eslint-disable-next-line no-var
var logPlatformActionMock: JestFn;
jest.mock("@/lib/application-deps", () => {
  rows = [];
  logPlatformActionMock = jest.fn().mockResolvedValue(undefined);
  const latest = (organizationId: string, kind: string) =>
    rows
      .filter(
        (row) => row.organizationId === organizationId && row.kind === kind,
      )
      .at(-1) ?? null;
  const graph = {
    prompts: { getCurrentVersion: jest.fn().mockResolvedValue(null) },
    organizationPrompts: {
      findLatest: jest.fn(
        async (input: { organizationId: string; kind: string }) =>
          latest(input.organizationId, input.kind),
      ),
      listLatest: jest.fn(),
      append: jest.fn(
        async (input: {
          organizationId: string;
          kind: OrganizationPromptVersionRow["kind"];
          markdown: string | null;
          authorUserId: string;
        }) => {
          const row: OrganizationPromptVersionRow = {
            id: `opv_${rows.length + 1}`,
            ...input,
            authorName: "Claire Morel",
            createdAt: new Date(),
          };
          rows.push(row);
          return row;
        },
      ),
    },
    audit: { logPlatformAction: logPlatformActionMock },
  };
  return { getApplicationDeps: () => graph };
});

import {
  resetOrganizationPromptAction,
  saveOrganizationPromptAction,
} from "@/app/[locale]/company/settings/coach-ia/actions";

function manager() {
  loadOrgSettingsActorMock.mockResolvedValue({
    organizationId: ORG_ID,
    userId: USER_ID,
    email: "manager@test.com",
    role: "ADMIN",
    canManageOrganizationSettings: true,
    organizationHasManager: true,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  rows.length = 0;
  manager();
});

describe("saveOrganizationPromptAction", () => {
  it("refuse un membre sans droit de modification, sans rien écrire", async () => {
    loadOrgSettingsActorMock.mockResolvedValue({
      organizationId: ORG_ID,
      userId: USER_ID,
      email: "commercial@test.com",
      role: "MEMBER",
      canManageOrganizationSettings: false,
      organizationHasManager: true,
    });

    const result = await saveOrganizationPromptAction({
      kind: "SONCAS",
      markdown: "Nouvelle consigne",
    });

    expect(result).toEqual({ ok: false, message: "Accès refusé." });
    expect(rows).toHaveLength(0);
    expect(logPlatformActionMock).not.toHaveBeenCalled();
  });

  it("refuse une session sans accès aux réglages", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await saveOrganizationPromptAction({
      kind: "SONCAS",
      markdown: "Nouvelle consigne",
    });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });

  it("refuse une consigne vide, avec le message de l'écran", async () => {
    const result = await saveOrganizationPromptAction({
      kind: "SONCAS",
      markdown: "  ",
    });
    expect(result).toEqual({
      ok: false,
      message: "La consigne ne peut pas être vide.",
    });
    expect(rows).toHaveLength(0);
  });

  it("refuse une consigne de plus de 20 000 caractères", async () => {
    const result = await saveOrganizationPromptAction({
      kind: "SONCAS",
      markdown: "a".repeat(20_001),
    });
    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("refuse un type qui ne se règle pas par organisation", async () => {
    const result = await saveOrganizationPromptAction({
      kind: "MEETING_BRIEFING",
      markdown: "Briefing",
    } as never);
    expect(result).toEqual({ ok: false, message: "Données invalides." });
  });

  it("enregistre pour l'organisation de la session, jamais pour celle du formulaire", async () => {
    const payload = {
      kind: "SONCAS" as const,
      markdown: "Termine le résumé par la phrase : consigne de test.",
      organizationId: OTHER_ORG_ID,
    };

    const result = await saveOrganizationPromptAction(payload);

    expect(result).toEqual({ ok: true, changed: true });
    expect(rows).toEqual([
      expect.objectContaining({
        organizationId: ORG_ID,
        kind: "SONCAS",
        authorUserId: USER_ID,
      }),
    ]);
    expect(logPlatformActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        actorUserId: USER_ID,
        action: "ORG_PROMPT_UPDATED",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/company/settings",
      "layout",
    );
  });
});

describe("resetOrganizationPromptAction", () => {
  it("rétablit la consigne d'origine et l'inscrit au journal d'audit", async () => {
    await saveOrganizationPromptAction({
      kind: "KISS",
      markdown: "KISS à notre manière",
    });
    jest.clearAllMocks();

    const result = await resetOrganizationPromptAction({ kind: "KISS" });

    expect(result).toEqual({ ok: true, changed: true });
    expect(rows.at(-1)).toEqual(
      expect.objectContaining({
        organizationId: ORG_ID,
        kind: "KISS",
        markdown: null,
      }),
    );
    expect(logPlatformActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ORG_PROMPT_RESET" }),
    );
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("ne touche pas à une consigne déjà d'origine", async () => {
    const result = await resetOrganizationPromptAction({ kind: "DISC" });
    expect(result).toEqual({ ok: true, changed: false });
    expect(rows).toHaveLength(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuse un membre sans droit de modification", async () => {
    loadOrgSettingsActorMock.mockResolvedValue(null);
    const result = await resetOrganizationPromptAction({ kind: "DISC" });
    expect(result).toEqual({ ok: false, message: "Accès refusé." });
  });
});
