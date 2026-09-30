import { meetingActionPlan } from "./meeting-action-plan";
import type { KissAnalysisResult } from "./kiss-result-zod";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";

const scorecard = (
  pointsLost: ScorecardAnalysisResult["pointsLost"],
): ScorecardAnalysisResult => ({
  gridId: "DECOUVERTE",
  gridName: "Rendez-vous de découverte",
  overallScore: 50,
  blocks: [],
  criteria: [],
  pointsLost,
  keep: [],
  improve: [],
  stop: [],
  goldenQuestion: "Q",
  challenge: "C",
  summary: "S",
});

const kiss: KissAnalysisResult = {
  keep: [],
  improve: ["- Reformuler avant de proposer"],
  stop: [],
  start: ["• Poser la date de la suite en séance"],
  goldenQuestion: "Q",
  coachingScore: 6,
  coachingScoreJustification: "j",
  summary: "s",
};

describe("meetingActionPlan", () => {
  it("part des points perdus, puis complète avec le coaching, avec échéance et responsable", () => {
    const plan = meetingActionPlan({
      scorecard: scorecard([
        {
          key: "C3",
          evidence: "e",
          whatToSayInstead: "« Vous vous situez où ? »",
        },
        { key: "c3", evidence: "e", whatToSayInstead: "doublon" },
        {
          key: "B3",
          evidence: "e",
          whatToSayInstead: "« Ça vous coûte combien ? »",
        },
        { key: "ZZ", evidence: "e", whatToSayInstead: "inconnu" },
      ]),
      kiss,
      sellerName: "Camille Roussel",
      nextMeetingAt: new Date(2026, 7, 12),
    });

    expect(plan.map((p) => p.title)).toEqual([
      "Couvrir budget",
      "Couvrir impact et coût de l'inaction",
      "Poser la date de la suite en séance",
      "Reformuler avant de proposer",
    ]);
    expect(plan[0]).toMatchObject({
      criterionKey: "C3",
      criterionLabel: "Budget",
      hint: "« Vous vous situez où ? »",
      when: "Le 12/08",
      who: "Camille Roussel",
    });
    expect(plan[2]).toMatchObject({
      criterionKey: null,
      when: "Cette semaine",
      who: "Camille Roussel",
    });
  });

  it("dit « Au prochain échange » et « Vous » quand rien n'est connu", () => {
    const plan = meetingActionPlan({
      scorecard: null,
      kiss,
      sellerName: null,
    });
    expect(plan).toHaveLength(2);
    expect(plan[0]).toMatchObject({ when: "Cette semaine", who: "Vous" });
  });

  it("reste vide sans analyse", () => {
    expect(
      meetingActionPlan({ scorecard: null, kiss: null, sellerName: null }),
    ).toEqual([]);
  });
});
