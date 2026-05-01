import { describe, expect, it } from "@jest/globals";
import { salesScoreFromSoncasResult } from "./dashboard-sales-score";

const validSoncas = {
  drivers: {
    securite: { score: 10, evidence: ["a"] },
    orgueil: { score: 20, evidence: ["b"] },
    nouveaute: { score: 30, evidence: ["c"] },
    confort: { score: 40, evidence: ["d"] },
    argent: { score: 50, evidence: ["e"] },
    sympathie: { score: 60, evidence: ["f"] },
  },
  dominant: "securite" as const,
  summary: "ok",
};

describe("salesScoreFromSoncasResult", () => {
  it("returns null when payload does not match schema", () => {
    expect(salesScoreFromSoncasResult({})).toBeNull();
  });

  it("returns rounded average of the six driver scores", () => {
    expect(salesScoreFromSoncasResult(validSoncas)).toBe(
      Math.round((10 + 20 + 30 + 40 + 50 + 60) / 6),
    );
  });
});
