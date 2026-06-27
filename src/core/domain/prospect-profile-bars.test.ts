import { discResultSchema, soncasResultSchema } from "./analysis-result-zod";
import {
  discBarItemsForUi,
  discBarsFromResult,
  soncasBarItemsForUi,
  soncasBarsFromResult,
} from "./prospect-profile-bars";

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
    expect(bars[0]?.pct).toBe(50);
  });

  it("orders SONCAS bars by descending score", () => {
    const bars = soncasBarsFromResult(soncas);
    expect(bars[0]?.key).toBe("securite");
    expect(bars[0]?.pct).toBe(35);
  });
});

describe("prospect-profile-bars UI helpers", () => {
  it("adds bar and pill classes for DISC", () => {
    const items = discBarItemsForUi(disc);
    expect(items[0]?.barClass).toBeTruthy();
    expect(items[0]?.pillClass).toBeTruthy();
  });

  it("adds bar and pill classes for SONCAS", () => {
    const items = soncasBarItemsForUi(soncas);
    expect(items[0]?.barClass).toBeTruthy();
    expect(items[0]?.pillClass).toBeTruthy();
  });
});
