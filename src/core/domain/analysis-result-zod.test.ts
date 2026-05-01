import { describe, expect, it } from "@jest/globals";
import {
  discResultSchema,
  kissResultSchema,
  soncasResultSchema,
} from "./analysis-result-zod";

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
};

const validDisc = {
  scores: { D: 1, I: 2, S: 3, C: 4 },
  dominant: "I" as const,
  evidence: ["x"],
  summary: "y",
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
});
