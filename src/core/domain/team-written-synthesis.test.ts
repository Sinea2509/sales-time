import { teamWrittenSynthesis } from "./team-written-synthesis";

const seller = (
  shortName: string,
  salesScore: number | null,
  engagementPct: number | null = null,
) => ({
  name: `${shortName} Test`,
  shortName,
  salesScore,
  scoredMeetings: 3,
  engagementPct,
});

describe("teamWrittenSynthesis", () => {
  const blocks = [
    { key: "C", name: "Décision", avgPercent: 46, meetings: 20 },
    { key: "D", name: "Suite et engagement", avgPercent: 70, meetings: 20 },
  ];
  const criteria = [
    {
      key: "C3",
      label: "Budget",
      blockKey: "C",
      avgLevel: 1.2,
      lowSharePct: 65,
      meetings: 20,
    },
    {
      key: "B3",
      label: "Impact et coût de l'inaction",
      blockKey: "B",
      avgLevel: 1.5,
      lowSharePct: 55,
      meetings: 20,
    },
  ];

  it("écrit quatre paragraphes chiffrés quand l'équipe est hétérogène", () => {
    const out = teamWrittenSynthesis({
      analyzedMeetings: 29,
      scorecards: 20,
      sellers: [
        seller("Léa", 84, 91),
        seller("Camille", 68, 78),
        seller("Yanis", 52, 43),
        seller("Marc", null),
      ],
      blockAverages: blocks,
      criterionShares: criteria,
    });

    expect(out?.paragraphs.map((p) => p.title)).toEqual([
      "Une équipe hétérogène.",
      "Le point commun.",
      "Une bonne pratique à faire partager.",
      "Notre suggestion pour la période.",
    ]);
    expect(out?.paragraphs[0]?.text).toContain("de 52 (Yanis) à 84 (Léa)");
    expect(out?.paragraphs[1]?.text).toContain(
      "budget manque dans 65 % des cas (critère C3)",
    );
    expect(out?.paragraphs[2]?.text).toContain(
      "Léa verrouille la suite en séance : 91 %",
    );
    expect(out?.paragraphs[2]?.text).toContain("Yanis (43 %)");
    expect(out?.paragraphs[3]?.text).toContain("« Décision » est à 46 %");
    expect(out?.figures).toEqual([
      { label: "Rendez-vous sans budget (C3)", value: "65 %" },
      {
        label: "Rendez-vous sans impact et coût de l'inaction (B3)",
        value: "55 %",
      },
      { label: "Suite et engagement, Léa", value: "91 %" },
      { label: "Suite et engagement, équipe", value: "70 %" },
      { label: "Suite et engagement, Yanis", value: "43 %" },
    ]);
  });

  it("lit une équipe groupée quand les scores sont proches", () => {
    const out = teamWrittenSynthesis({
      analyzedMeetings: 10,
      scorecards: 0,
      sellers: [seller("Léa", 70), seller("Camille", 64)],
      blockAverages: [],
      criterionShares: [],
    });
    expect(out?.paragraphs[0]?.title).toBe("Une équipe groupée.");
    expect(out?.paragraphs[0]?.text).toContain("6 points d'écart");
    expect(out?.paragraphs).toHaveLength(1);
  });

  it("ne dit rien sans commercial noté", () => {
    expect(
      teamWrittenSynthesis({
        analyzedMeetings: 3,
        scorecards: 0,
        sellers: [seller("Marc", null)],
        blockAverages: [],
        criterionShares: [],
      }),
    ).toBeNull();
  });
});
