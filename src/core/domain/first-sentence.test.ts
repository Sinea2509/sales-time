import { describe, expect, it } from "@jest/globals";
import { firstSentence } from "./first-sentence";

describe("firstSentence", () => {
  it("rend la première phrase", () => {
    expect(
      firstSentence("Il écoute bien. Il pourrait chiffrer davantage."),
    ).toBe("Il écoute bien.");
  });

  it("garde un texte d'une seule phrase sans point", () => {
    expect(firstSentence("Écoute active solide")).toBe("Écoute active solide");
  });

  it("ne coupe pas sur un nombre décimal", () => {
    expect(firstSentence("Note de 3.5 sur 5 ce mois-ci. Suite.")).toBe(
      "Note de 3.5 sur 5 ce mois-ci.",
    );
  });

  it("raccourcit une phrase trop longue au dernier mot entier", () => {
    const out = firstSentence("mot ".repeat(100), 40);
    expect(out?.endsWith("…")).toBe(true);
    expect((out ?? "").length).toBeLessThanOrEqual(41);
  });

  it("rend null pour un texte vide", () => {
    expect(firstSentence("   ")).toBeNull();
    expect(firstSentence(null)).toBeNull();
  });
});
