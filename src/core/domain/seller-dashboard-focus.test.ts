import {
  sellerDashboardFocus,
  type SellerFocusMeeting,
} from "./seller-dashboard-focus";
import { DEFAULT_SCORECARD_GRID, scorecardCriteria } from "./scorecard-grid";
import { computeScorecardScore } from "./scorecard-score";

function scorecard(
  challenge: string,
  levelsByKey: Record<string, number> = {},
) {
  const criteria = scorecardCriteria(DEFAULT_SCORECARD_GRID).map((c) => ({
    key: c.key,
    level: levelsByKey[c.key] ?? 2,
    evidence: [],
  }));
  const { blocks, overallScore } = computeScorecardScore(
    DEFAULT_SCORECARD_GRID,
    criteria,
  );
  return {
    gridId: DEFAULT_SCORECARD_GRID.id,
    gridName: DEFAULT_SCORECARD_GRID.name,
    overallScore,
    blocks,
    criteria,
    pointsLost: [],
    keep: [],
    improve: [],
    stop: [],
    goldenQuestion: "Q",
    challenge,
    summary: "S",
  };
}

const kiss = (ecouteActive: number) => ({
  keep: ["k"],
  improve: ["i"],
  stop: [],
  start: ["s"],
  goldenQuestion: "Q",
  coachingScore: 7,
  coachingScoreJustification: "j",
  summary: "s",
  sellerSkills: {
    assertivite: 50,
    ecouteActive,
    capitalSympathie: 60,
    argumentation: 50,
    objections: 40,
    nextSteps: 55,
  },
});

function rdv(
  over: Partial<SellerFocusMeeting> & { id: string; day: number },
): SellerFocusMeeting {
  const { day, ...rest } = over;
  return {
    personId: `p-${over.id}`,
    prospectName: "Hélène Vasseur",
    prospectCompany: "Groupe Vermont",
    meetingAt: new Date(2026, 8, day),
    outcome: "FOLLOW_UP",
    potentialAmount: 10_000,
    salesScore: 60,
    latestScorecardResult: null,
    latestKissResult: null,
    ...rest,
  };
}

describe("sellerDashboardFocus", () => {
  it("reprend le défi du dernier rendez-vous noté et nomme sa société", () => {
    const focus = sellerDashboardFocus([
      rdv({
        id: "old",
        day: 1,
        latestScorecardResult: scorecard("Ancien défi"),
      }),
      rdv({
        id: "new",
        day: 9,
        prospectCompany: null,
        latestScorecardResult: scorecard("Obtenir un chiffre d'impact"),
      }),
      rdv({ id: "none", day: 12 }),
    ]);
    expect(focus.challenge).toEqual({
      text: "Obtenir un chiffre d'impact",
      meetingId: "new",
      from: "Hélène Vasseur",
    });
  });

  it("calcule l'axe, les points forts, le pipeline et la courbe", () => {
    const focus = sellerDashboardFocus([
      rdv({
        id: "a",
        day: 2,
        salesScore: 50,
        latestScorecardResult: scorecard("D", { C1: 0, C2: 0, C3: 0 }),
        latestKissResult: kiss(80),
      }),
      rdv({
        id: "b",
        day: 5,
        salesScore: 70,
        latestKissResult: kiss(76),
        outcome: "WON",
      }),
    ]);

    expect(focus.axis?.key).toBe("C");
    expect(focus.strengths.meetings).toBe(2);
    expect(focus.strengths.skills[0]).toEqual({
      key: "ecouteActive",
      label: "Écoute",
      score: 78,
    });
    expect(focus.pipeline).toEqual({
      totalEuro: 10_000,
      activeDeals: 1,
      valuedDeals: 1,
    });
    expect(focus.scoreSeries).toEqual([50, 70]);
  });

  it("reste vide sans analyse", () => {
    const focus = sellerDashboardFocus([]);
    expect(focus.challenge).toBeNull();
    expect(focus.axis).toBeNull();
    expect(focus.strengths).toEqual({ skills: [], meetings: 0 });
  });
});
