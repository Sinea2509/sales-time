import { discResultSchema, soncasResultSchema } from "./analysis-result-zod";
import { discBarsFromResult, soncasBarsFromResult } from "./prospect-profile-bars";

const disc = discResultSchema.parse({
  scores: { D: 20, I: 30, S: 40, C: 90 },
  dominant: "C",
  evidence: ["e"],
  summary: "s",
});

const soncas = soncasResultSchema.parse({
  drivers: {
    securite: { score: 80, evidence: ["e"] },
    orgueil: { score: 10, evidence: ["e"] },
    nouveaute: { score: 20, evidence: ["e"] },
    confort: { score: 30, evidence: ["e"] },
    argent: { score: 40, evidence: ["e"] },
    sympathie: { score: 50, evidence: ["e"] },
  },
  dominant: "securite",
  summary: "s",
});

describe("prospect-profile-bars", () => {
  it("orders DISC bars by descending score", () => {
    const bars = discBarsFromResult(disc);
    expect(bars[0]?.key).toBe("C");
    expect(bars[0]?.pct).toBe(90);
  });

  it("orders SONCAS bars by descending score", () => {
    const bars = soncasBarsFromResult(soncas);
    expect(bars[0]?.key).toBe("securite");
    expect(bars[0]?.pct).toBe(80);
  });
});
