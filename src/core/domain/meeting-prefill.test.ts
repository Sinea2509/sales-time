import { describe, expect, it } from "@jest/globals";
import {
  PREFILL_HEAD_CHARS,
  PREFILL_TAIL_CHARS,
  sanitizeMeetingFactsSuggestion,
  transcriptExcerptForPrefill,
  type MeetingFactsSuggestion,
} from "./meeting-prefill";

const OPTIONS = ["Découverte", "Proposition"];

function raw(partial: Partial<MeetingFactsSuggestion>): MeetingFactsSuggestion {
  return {
    prospectName: null,
    prospectCompany: null,
    meetingType: null,
    outcome: null,
    potentialAmount: null,
    ...partial,
  };
}

describe("transcriptExcerptForPrefill", () => {
  it("rend un transcript court en entier", () => {
    expect(transcriptExcerptForPrefill("  Bonjour.  ")).toBe("Bonjour.");
  });

  it("garde le début et la fin d'un long transcript", () => {
    const text = `${"a".repeat(PREFILL_HEAD_CHARS)}${"m".repeat(5000)}${"z".repeat(PREFILL_TAIL_CHARS)}`;
    const excerpt = transcriptExcerptForPrefill(text);
    expect(excerpt.startsWith("a".repeat(PREFILL_HEAD_CHARS))).toBe(true);
    expect(excerpt.endsWith("z".repeat(PREFILL_TAIL_CHARS))).toBe(true);
    expect(excerpt).not.toContain("m");
  });
});

describe("sanitizeMeetingFactsSuggestion", () => {
  it("recopie le type tel que l'organisation l'écrit", () => {
    expect(
      sanitizeMeetingFactsSuggestion(
        raw({ meetingType: "decouverte" }),
        OPTIONS,
      ).meetingType,
    ).toBe("Découverte");
    expect(
      sanitizeMeetingFactsSuggestion(raw({ meetingType: "Démo" }), OPTIONS)
        .meetingType,
    ).toBeNull();
  });

  it("refuse une étiquette de transcript à la place d'un nom", () => {
    expect(
      sanitizeMeetingFactsSuggestion(raw({ prospectName: "Prospect" }), OPTIONS)
        .prospectName,
    ).toBeNull();
    expect(
      sanitizeMeetingFactsSuggestion(
        raw({ prospectName: "Intervenant 2" }),
        OPTIONS,
      ).prospectName,
    ).toBeNull();
  });

  it("prend l'entreprise quand la personne n'est pas nommée", () => {
    expect(
      sanitizeMeetingFactsSuggestion(
        raw({ prospectName: null, prospectCompany: "Durand SA" }),
        OPTIONS,
      ).prospectName,
    ).toBe("Durand SA");
  });

  it("ne garde qu'un montant plausible", () => {
    const amount = (n: number | null) =>
      sanitizeMeetingFactsSuggestion(raw({ potentialAmount: n }), OPTIONS)
        .potentialAmount;
    expect(amount(12000.456)).toBe(12000.46);
    expect(amount(0)).toBeNull();
    expect(amount(-5)).toBeNull();
    expect(amount(5e12)).toBeNull();
  });
});
