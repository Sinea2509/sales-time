import { salesScoreSeries } from "./sales-score-series";

const at = (day: number) => new Date(2026, 8, day);

describe("salesScoreSeries", () => {
  it("ordonne les scores du plus ancien au plus récent et ignore les rendez-vous sans score", () => {
    expect(
      salesScoreSeries([
        { meetingAt: at(9), salesScore: 70 },
        { meetingAt: at(2), salesScore: 50 },
        { meetingAt: at(5), salesScore: null },
        { meetingAt: at(6), salesScore: 60 },
      ]),
    ).toEqual([50, 60, 70]);
  });

  it("groupe en tranches quand les points dépassent la place", () => {
    const many = Array.from({ length: 24 }, (_, i) => ({
      meetingAt: at(i + 1),
      salesScore: i < 12 ? 40 : 80,
    }));
    const serie = salesScoreSeries(many, 4);
    expect(serie).toEqual([40, 40, 80, 80]);
  });
});
