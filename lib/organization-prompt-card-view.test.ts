import { describe, expect, it } from "@jest/globals";
import {
  ORGANIZATION_PROMPT_DESCRIPTIONS,
  organizationPromptCardView,
} from "./organization-prompt-card-view";

describe("organizationPromptCardView", () => {
  it("annonce la consigne d'origine avec la version du super admin", () => {
    const view = organizationPromptCardView({
      kind: "SONCAS",
      markdown: "texte",
      originVersion: 4,
      modified: null,
    });
    expect(view).toEqual({
      kind: "SONCAS",
      title: "SONCAS",
      description: ORGANIZATION_PROMPT_DESCRIPTIONS.SONCAS,
      markdown: "texte",
      modified: false,
      badge: "Consigne d'origine, version 4",
      badgeTooltip: null,
    });
  });

  it("n'invente pas de version quand le super admin n'en a publié aucune", () => {
    const view = organizationPromptCardView({
      kind: "DISC",
      markdown: "texte",
      originVersion: null,
      modified: null,
    });
    expect(view.badge).toBe("Consigne d'origine");
  });

  it("date la modification à l'heure de Paris et nomme son auteur", () => {
    const view = organizationPromptCardView({
      kind: "KISS",
      markdown: "texte",
      originVersion: 4,
      // 23 h 30 à Londres, déjà le 25 à Paris.
      modified: {
        at: new Date("2026-09-24T22:30:00.000Z"),
        authorName: "Claire Morel",
      },
    });
    expect(view.modified).toBe(true);
    expect(view.badge).toBe("Modifiée le 25 septembre 2026");
    expect(view.badgeTooltip).toBe("Modifiée par Claire Morel");
  });

  it("écrit « 1er » le premier du mois", () => {
    const view = organizationPromptCardView({
      kind: "KISS",
      markdown: "texte",
      originVersion: 4,
      modified: {
        at: new Date("2026-10-01T10:00:00.000Z"),
        authorName: null,
      },
    });
    expect(view.badge).toBe("Modifiée le 1er octobre 2026");
    expect(view.badgeTooltip).toBeNull();
  });
});

describe("ORGANIZATION_PROMPT_DESCRIPTIONS", () => {
  it("tire ses nombres des règles qu'elle décrit", () => {
    expect(ORGANIZATION_PROMPT_DESCRIPTIONS.SCORECARD).toContain(
      "25 critères en 5 blocs, niveaux 0 à 4.",
    );
    expect(ORGANIZATION_PROMPT_DESCRIPTIONS.SONCAS).toContain(
      "citations obligatoires au-dessus de 19.",
    );
  });

  it("ne prête pas à DISC une règle de preuve que le produit n'applique pas", () => {
    expect(ORGANIZATION_PROMPT_DESCRIPTIONS.DISC).not.toContain(
      "Même règle que SONCAS",
    );
    expect(ORGANIZATION_PROMPT_DESCRIPTIONS.DISC).not.toContain(
      "ses propres preuves",
    );
  });

  it("renvoie à l'onglet tel qu'il s'appelle", () => {
    expect(ORGANIZATION_PROMPT_DESCRIPTIONS.FOLLOW_UP_EMAIL).toContain(
      "l'onglet E-mail de suivi",
    );
  });
});
