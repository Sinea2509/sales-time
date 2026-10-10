import { describe, expect, it } from "@jest/globals";
import { salesScoreForMeeting } from "./dashboard-sales-score";

const grille = {
  gridId: "DECOUVERTE",
  gridName: "Rendez-vous de découverte",
  overallScore: 59,
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

describe("salesScoreForMeeting", () => {
  it("prend la note de la grille, sur 100, quand elle est lisible", () => {
    expect(salesScoreForMeeting({ scorecardResult: grille })).toBe(59);
  });

  it("ne note pas un rendez-vous sans grille lisible : aucun repli", () => {
    expect(salesScoreForMeeting({ scorecardResult: null })).toBeNull();
    expect(salesScoreForMeeting({ scorecardResult: {} })).toBeNull();
  });
});
