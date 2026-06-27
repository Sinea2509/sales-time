import { describe, expect, it } from "@jest/globals";
import {
  discAnalysisOutputSchema,
  discResultSchema,
  soncasAnalysisOutputSchema,
  soncasResultSchema,
} from "./analysis-result-zod";
import { kissResultSchema } from "./kiss-result-zod";

const driver = (score: number) => ({ score, evidence: ["e"] });

const validSoncas = {
  drivers: {
    securite: driver(1),
    orgueil: driver(2),
    nouveaute: driver(3),
    confort: driver(4),
    argent: driver(5),
    sympathie: driver(6),
  },
  dominant: "argent" as const,
  summary: "s",
  actionableAdvice: {
    whatItMeans: "Le prospect cherche surtout la rentabilité.",
    howToTalk: "Parler ROI et payback concret.",
    whatToAvoid: "Éviter le discours vague sans chiffres.",
  },
};

const validDisc = {
  scores: { D: 1, I: 2, S: 3, C: 4 },
  dominant: "I" as const,
  evidence: ["x"],
  summary: "y",
  actionableAdvice: {
    whatItMeans: "Profil influent : relationnel et enthousiaste.",
    howToTalk: "Rythme dynamique, exemples concrets, reconnaissance.",
    whatToAvoid: "Ne pas être trop sec ou exclusivement technique.",
  },
};

describe("analysis-result-zod", () => {
  it("parses SONCAS and DISC payloads and re-exports kissResultSchema", () => {
    expect(soncasResultSchema.safeParse(validSoncas).success).toBe(true);
    expect(discResultSchema.safeParse(validDisc).success).toBe(true);
    expect(
      kissResultSchema.safeParse({
        keep: ["a"],
        improve: ["b"],
        stop: ["c"],
        start: ["d"],
        goldenQuestion: "q",
        coachingScore: 5,
        coachingScoreJustification: "j",
        summary: "sum",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(soncasResultSchema.safeParse({}).success).toBe(false);
    expect(discResultSchema.safeParse({}).success).toBe(false);
  });

  it("requires actionableAdvice on AI output schemas", () => {
    const { actionableAdvice: soncasAdvice, ...soncasWithoutAdvice } = validSoncas;
    const { actionableAdvice: discAdvice, ...discWithoutAdvice } = validDisc;
    expect(soncasAdvice).toBeDefined();
    expect(discAdvice).toBeDefined();
    expect(soncasAnalysisOutputSchema.safeParse(soncasWithoutAdvice).success).toBe(
      false,
    );
    expect(discAnalysisOutputSchema.safeParse(discWithoutAdvice).success).toBe(false);
    expect(soncasAnalysisOutputSchema.safeParse(validSoncas).success).toBe(true);
    expect(discAnalysisOutputSchema.safeParse(validDisc).success).toBe(true);
  });

  it("accepts legacy payloads without actionableAdvice", () => {
    const { actionableAdvice: soncasAdvice, ...legacySoncas } = validSoncas;
    const { actionableAdvice: discAdvice, ...legacyDisc } = validDisc;
    expect(soncasAdvice).toBeDefined();
    expect(discAdvice).toBeDefined();
    expect(soncasResultSchema.safeParse(legacySoncas).success).toBe(true);
    expect(discResultSchema.safeParse(legacyDisc).success).toBe(true);
  });
});
