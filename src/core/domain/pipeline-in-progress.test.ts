import {
  pipelineInProgress,
  type PipelineMeeting,
} from "./pipeline-in-progress";

function rdv(
  personId: string,
  outcome: PipelineMeeting["outcome"],
  potentialAmount: number | null,
  day: number,
): PipelineMeeting {
  return {
    personId,
    outcome,
    potentialAmount,
    meetingAt: new Date(2026, 8, day),
  };
}

describe("pipelineInProgress", () => {
  it("compte un contact une seule fois, par son dernier rendez-vous", () => {
    const out = pipelineInProgress([
      rdv("p1", "FOLLOW_UP", 10_000, 1),
      rdv("p1", "FOLLOW_UP", 15_000, 9),
      rdv("p2", "OTHER", 5_000, 3),
    ]);
    expect(out).toEqual({ totalEuro: 20_000, activeDeals: 2, valuedDeals: 2 });
  });

  it("ferme une affaire gagnée ou perdue, même si un ancien rendez-vous la tenait ouverte", () => {
    const out = pipelineInProgress([
      rdv("p1", "FOLLOW_UP", 10_000, 1),
      rdv("p1", "WON", 10_000, 9),
      rdv("p2", "LOST", 8_000, 3),
      rdv("p3", "NO_SHOW", null, 4),
    ]);
    expect(out).toEqual({ totalEuro: 0, activeDeals: 1, valuedDeals: 0 });
  });

  it("vaut zéro sans rendez-vous", () => {
    expect(pipelineInProgress([])).toEqual({
      totalEuro: 0,
      activeDeals: 0,
      valuedDeals: 0,
    });
  });
});
