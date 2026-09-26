import {
  parseScorecards,
  scorecardBlockAverages,
  scorecardCriterionShares,
  sellerMonthlyAxis,
} from "./scorecard-team-axes";
import { DEFAULT_SCORECARD_GRID, scorecardCriteria } from "./scorecard-grid";
import { computeScorecardScore } from "./scorecard-score";

/** Une scorecard enregistrée, avec des niveaux choisis par clé. */
function scorecard(levelsByKey: Record<string, number>) {
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
    challenge: "C",
    summary: "S",
  };
}

describe("scorecard-team-axes", () => {
  it("ignore une ligne illisible et lit les autres", () => {
    expect(parseScorecards([{ nope: true }, scorecard({})])).toHaveLength(1);
  });

  it("range les blocs du plus en retrait au plus solide, en pourcentage", () => {
    const results = parseScorecards([
      scorecard({ C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 }),
      scorecard({ C1: 4, C2: 4, C3: 4, C4: 4, C5: 4, C6: 4 }),
    ]);
    const averages = scorecardBlockAverages(results);

    /* Décision vaut 0 % puis 100 % : 50 % en moyenne, comme les autres à 2/4. */
    expect(averages.map((a) => a.avgPercent)).toEqual([50, 50, 50, 50, 50]);
    expect(averages.every((a) => a.meetings === 2)).toBe(true);

    const weakerC = scorecardBlockAverages(
      parseScorecards([scorecard({ C1: 0, C2: 0, C3: 0 })]),
    );
    expect(weakerC[0]?.key).toBe("C");
    expect(weakerC[0]?.name).toBe("Décision");
    expect(weakerC[0]?.avgPercent).toBe(25);
  });

  it("compte la part des rendez-vous où un critère manque", () => {
    const shares = scorecardCriterionShares(
      parseScorecards([
        scorecard({ C3: 0 }),
        scorecard({ C3: 1 }),
        scorecard({ C3: 4 }),
      ]),
    );
    const budget = shares.find((s) => s.key === "C3");
    expect(budget?.label).toBe("Budget");
    expect(budget?.blockKey).toBe("C");
    expect(budget?.lowSharePct).toBe(67);
    expect(budget?.avgLevel).toBe(1.7);
    /* Le critère le plus manquant vient en tête. */
    expect(shares[0]?.key).toBe("C3");
  });

  it("nomme l'axe du mois d'un commercial et le rendez-vous qui l'illustre", () => {
    const axis = sellerMonthlyAxis([
      { meetingId: "m1", result: scorecard({ D1: 0, D2: 0, D3: 0 }) },
      { meetingId: "m2", result: scorecard({ D1: 1, D2: 1, D3: 1 }) },
      { meetingId: "m3", result: scorecard({}) },
      { meetingId: "m4", result: "illisible" },
    ]);

    expect(axis?.key).toBe("D");
    expect(axis?.name).toBe("Suite et engagement");
    expect(axis?.meetings).toBe(3);
    /* 0 %, 25 % et 50 % : trois rendez-vous sous les 60 %. */
    expect(axis?.lowMeetings).toBe(3);
    expect(axis?.exampleMeetingId).toBe("m1");
  });

  it("ne dit rien sans scorecard", () => {
    expect(sellerMonthlyAxis([])).toBeNull();
  });
});
