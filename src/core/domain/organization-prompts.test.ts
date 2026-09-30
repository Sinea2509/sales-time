import { describe, expect, it } from "@jest/globals";
import {
  aiLogPromptVersionLabel,
  checkOrganizationPromptMarkdown,
  isOrganizationPromptKind,
  ORGANIZATION_PROMPT_EMPTY_MESSAGE,
  ORGANIZATION_PROMPT_KINDS,
  ORGANIZATION_PROMPT_MAX_CHARS,
  ORGANIZATION_PROMPT_TITLES,
  ORGANIZATION_PROMPT_TOO_LONG_MESSAGE,
  pickPromptMarkdown,
} from "./organization-prompts";

describe("les six consignes réglables par une organisation", () => {
  it("sont celles de la fiche du rendez-vous, dans l'ordre des cartes", () => {
    expect(ORGANIZATION_PROMPT_KINDS).toEqual([
      "SCORECARD",
      "SONCAS",
      "DISC",
      "KISS",
      "MEETING_DETAIL_SYNTHESIS",
      "FOLLOW_UP_EMAIL",
    ]);
  });

  it("laissent au super admin le briefing et les synthèses du manager", () => {
    for (const kind of [
      "MEETING_BRIEFING",
      "SELLER_PERFORMANCE",
      "SELLER_AFFINITY",
      "ORG_KISS_ROLLUP",
      "TEAM_COACHING",
    ]) {
      expect(isOrganizationPromptKind(kind)).toBe(false);
    }
    expect(isOrganizationPromptKind("SONCAS")).toBe(true);
  });

  it("ont chacune un titre", () => {
    for (const kind of ORGANIZATION_PROMPT_KINDS) {
      expect(ORGANIZATION_PROMPT_TITLES[kind].trim()).not.toBe("");
    }
  });
});

describe("checkOrganizationPromptMarkdown", () => {
  it("refuse une consigne vide ou faite de blancs", () => {
    expect(checkOrganizationPromptMarkdown("")).toEqual({
      ok: false,
      message: ORGANIZATION_PROMPT_EMPTY_MESSAGE,
    });
    expect(checkOrganizationPromptMarkdown(" \n\t ")).toEqual({
      ok: false,
      message: ORGANIZATION_PROMPT_EMPTY_MESSAGE,
    });
    expect(ORGANIZATION_PROMPT_EMPTY_MESSAGE).toBe(
      "La consigne ne peut pas être vide.",
    );
  });

  it("accepte 20 000 caractères et refuse au-delà", () => {
    expect(ORGANIZATION_PROMPT_MAX_CHARS).toBe(20_000);
    expect(
      checkOrganizationPromptMarkdown("a".repeat(ORGANIZATION_PROMPT_MAX_CHARS))
        .ok,
    ).toBe(true);
    expect(
      checkOrganizationPromptMarkdown(
        "a".repeat(ORGANIZATION_PROMPT_MAX_CHARS + 1),
      ),
    ).toEqual({ ok: false, message: ORGANIZATION_PROMPT_TOO_LONG_MESSAGE });
  });

  it("retire les blancs de début et de fin, et compte sans eux", () => {
    const texte = "a".repeat(ORGANIZATION_PROMPT_MAX_CHARS);
    expect(checkOrganizationPromptMarkdown(`\n  ${texte}  \n`)).toEqual({
      ok: true,
      markdown: texte,
    });
  });
});

describe("pickPromptMarkdown", () => {
  it("prend la consigne de l'organisation quand elle en a une", () => {
    expect(
      pickPromptMarkdown({
        organizationMarkdown: "org",
        globalMarkdown: "global",
        codeMarkdown: "code",
      }),
    ).toEqual({ markdown: "org", source: "organization" });
  });

  it("revient à celle du super admin après une réinitialisation", () => {
    expect(
      pickPromptMarkdown({
        organizationMarkdown: null,
        globalMarkdown: "global",
        codeMarkdown: "code",
      }),
    ).toEqual({ markdown: "global", source: "global" });
  });

  it("revient à celle du code quand le super admin n'a rien publié", () => {
    expect(
      pickPromptMarkdown({
        organizationMarkdown: undefined,
        globalMarkdown: undefined,
        codeMarkdown: "code",
      }),
    ).toEqual({ markdown: "code", source: "code" });
  });

  it("ne laisse jamais le modèle sans consigne : un texte de blancs compte comme absent", () => {
    expect(
      pickPromptMarkdown({
        organizationMarkdown: "  ",
        globalMarkdown: "\n",
        codeMarkdown: "code",
      }),
    ).toEqual({ markdown: "code", source: "code" });
  });
});

describe("aiLogPromptVersionLabel", () => {
  it("garde le numéro du super admin quand sa consigne a servi", () => {
    expect(
      aiLogPromptVersionLabel({
        globalVersion: 4,
        organizationPromptVersionId: null,
      }),
    ).toBe("4");
  });

  it("désigne la consigne de l'organisation quand c'est elle qui a servi", () => {
    expect(
      aiLogPromptVersionLabel({
        globalVersion: 4,
        organizationPromptVersionId: "opv_1",
      }),
    ).toBe("org:opv_1");
  });
});
