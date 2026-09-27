import {
  salesScoreFromAnalyses,
  salesScoreFromScorecardResult,
} from "./meeting-sales-score";

const scorecard = {
  gridId: "DECOUVERTE",
  gridName: "Rendez-vous de découverte",
  overallScore: 62,
  blocks: [],
  criteria: [],
  pointsLost: [],
  keep: [],
  improve: [],
  stop: [],
  goldenQuestion: "Q",
  challenge: "C",
  summary: "S",
};

describe("salesScoreFromScorecardResult", () => {
  it("lit la note de la grille", () => {
    expect(salesScoreFromScorecardResult(scorecard)).toBe(62);
  });

  it("ne rend rien d'une ligne illisible", () => {
    expect(salesScoreFromScorecardResult({ overallScore: "x" })).toBeNull();
    expect(salesScoreFromScorecardResult(null)).toBeNull();
  });
});

describe("salesScoreFromAnalyses", () => {
  it("ignore SONCAS et ne lit que la scorecard", () => {
    expect(
      salesScoreFromAnalyses([
        { kind: "SONCAS", result: { drivers: {} } },
        { kind: "SCORECARD", result: scorecard },
      ]),
    ).toBe(62);
    expect(
      salesScoreFromAnalyses([{ kind: "SONCAS", result: { drivers: {} } }]),
    ).toBeNull();
  });
});
