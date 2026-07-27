import { describe, expect, it } from "@jest/globals";
import { salesScoreBarClass, salesScoreColorClass } from "./sales-score-color";

describe("salesScoreColorClass", () => {
  it("returns red below 50", () => {
    expect(salesScoreColorClass(49)).toContain("red");
  });

  it("returns amber from 50 to 69", () => {
    expect(salesScoreColorClass(50)).toContain("amber");
    expect(salesScoreColorClass(69)).toContain("amber");
  });

  it("returns green from 70", () => {
    expect(salesScoreColorClass(70)).toContain("emerald");
  });
});

describe("salesScoreBarClass", () => {
  /*
    La barre doit dire la même chose que le chiffre posé à côté d'elle : le
    test parcourt l'échelle entière et compare la famille de couleur des deux
    classes, plutôt que de réécrire les seuils une seconde fois.
  */
  it("suit les mêmes seuils que la couleur du texte, sur toute l'échelle", () => {
    const famille = (classe: string) =>
      ["red", "amber", "emerald"].find((f) => classe.includes(f));
    for (let score = 0; score <= 100; score += 1) {
      expect(famille(salesScoreBarClass(score))).toBe(
        famille(salesScoreColorClass(score)),
      );
    }
  });

  it("peint un remplissage, jamais une encre de texte", () => {
    for (const score of [0, 49, 50, 69, 70, 100]) {
      expect(salesScoreBarClass(score)).toMatch(/^bg-/);
      expect(salesScoreBarClass(score)).not.toContain("text-");
    }
  });
});
