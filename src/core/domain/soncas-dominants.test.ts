import type { SoncasAnalysisResult } from "./analysis-result-zod";
import { joinSoncasNames, soncasDominantKeys } from "./soncas-dominants";

function soncas(
  scores: Partial<Record<keyof SoncasAnalysisResult["drivers"], number>>,
  dominant: SoncasAnalysisResult["dominant"],
): SoncasAnalysisResult {
  const driver = (score: number) => ({ score, evidence: [] });
  return {
    drivers: {
      securite: driver(scores.securite ?? 0),
      orgueil: driver(scores.orgueil ?? 0),
      nouveaute: driver(scores.nouveaute ?? 0),
      confort: driver(scores.confort ?? 0),
      argent: driver(scores.argent ?? 0),
      sympathie: driver(scores.sympathie ?? 0),
    },
    dominant,
    summary: "",
  };
}

describe("soncasDominantKeys", () => {
  it("rend le seul levier en tête", () => {
    expect(
      soncasDominantKeys(soncas({ argent: 70, securite: 40 }, "argent")),
    ).toEqual(["argent"]);
  });

  it("rend tous les leviers à égalité, celui du modèle en premier", () => {
    expect(
      soncasDominantKeys(
        soncas({ securite: 60, argent: 60, confort: 20 }, "argent"),
      ),
    ).toEqual(["argent", "securite"]);
  });

  it("garde l'ordre de l'acronyme quand le modèle a nommé un levier hors égalité", () => {
    expect(
      soncasDominantKeys(
        soncas({ securite: 60, argent: 60, confort: 20 }, "confort"),
      ),
    ).toEqual(["securite", "argent"]);
  });
});

describe("joinSoncasNames", () => {
  it("écrit une énumération française", () => {
    expect(joinSoncasNames(["Argent"])).toBe("Argent");
    expect(joinSoncasNames(["Sécurité", "Argent"])).toBe("Sécurité et Argent");
    expect(joinSoncasNames(["Sécurité", "Argent", "Confort"])).toBe(
      "Sécurité, Argent et Confort",
    );
  });
});
