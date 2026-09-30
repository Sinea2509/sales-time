import { meetingAnalysisProgress } from "./meeting-analysis-progress";

const T0 = new Date("2026-09-26T10:00:00.000Z");
const later = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

describe("meetingAnalysisProgress", () => {
  it("au départ, la première vague tourne et rien n'est fait", () => {
    const p = meetingAnalysisProgress({
      status: "PROCESSING",
      updatedAt: T0,
      analyses: [],
      scorecardApplicable: true,
    });

    expect(p.totalCount).toBe(5);
    expect(p.doneCount).toBe(0);
    expect(p.percent).toBe(0);
    expect(p.steps.map((s) => [s.key, s.state])).toEqual([
      ["SONCAS", "running"],
      ["DISC", "running"],
      ["SCORECARD", "running"],
      ["OBJECTIONS", "running"],
      ["KISS", "pending"],
    ]);
  });

  it("coche SONCAS dès qu'il est écrit, et KISS attend la fin de la vague", () => {
    const p = meetingAnalysisProgress({
      status: "PROCESSING",
      updatedAt: T0,
      analyses: [{ kind: "SONCAS", createdAt: later(12) }],
      scorecardApplicable: true,
    });

    expect(p.doneCount).toBe(1);
    expect(p.percent).toBe(20);
    expect(p.steps.find((s) => s.key === "SONCAS")?.state).toBe("done");
    expect(p.steps.find((s) => s.key === "DISC")?.state).toBe("running");
    expect(p.steps.find((s) => s.key === "KISS")?.state).toBe("pending");
  });

  it("passe à KISS quand la vague est complète", () => {
    const wave = ["SONCAS", "DISC", "SCORECARD", "OBJECTIONS"].map((kind) => ({
      kind,
      createdAt: later(15),
    }));

    const kissRunning = meetingAnalysisProgress({
      status: "PROCESSING",
      updatedAt: T0,
      analyses: wave,
      scorecardApplicable: true,
    });
    expect(kissRunning.steps.find((s) => s.key === "KISS")?.state).toBe(
      "running",
    );
    expect(kissRunning.runningCount).toBe(1);
    expect(kissRunning.percent).toBe(80);
  });

  /*
    Une relance garde les anciennes analyses jusqu'à leur remplacement. Elles
    ne doivent pas cocher les étapes du nouveau traitement.
  */
  it("ignore les analyses nées avant la relance", () => {
    const p = meetingAnalysisProgress({
      status: "PROCESSING",
      updatedAt: T0,
      analyses: [
        { kind: "SONCAS", createdAt: later(-600) },
        { kind: "DISC", createdAt: later(-600) },
        { kind: "KISS", createdAt: later(-600) },
      ],
      scorecardApplicable: false,
    });

    expect(p.doneCount).toBe(0);
    expect(p.steps.map((s) => s.state)).toEqual([
      "running",
      "running",
      "running",
      "pending",
    ]);
  });

  it("sans grille, la scorecard n'est pas une étape", () => {
    const p = meetingAnalysisProgress({
      status: "PROCESSING",
      updatedAt: T0,
      analyses: [],
      scorecardApplicable: false,
    });

    expect(p.totalCount).toBe(4);
    expect(p.steps.map((s) => s.key)).toEqual([
      "SONCAS",
      "DISC",
      "OBJECTIONS",
      "KISS",
    ]);
  });

  it("en READY, tout est fait", () => {
    const p = meetingAnalysisProgress({
      status: "READY",
      updatedAt: later(60),
      analyses: [
        { kind: "SONCAS", createdAt: later(10) },
        { kind: "DISC", createdAt: later(10) },
        { kind: "KISS", createdAt: later(30) },
      ],
      scorecardApplicable: false,
    });

    expect(p.percent).toBe(100);
    expect(p.runningCount).toBe(0);
    expect(p.steps.every((s) => s.state === "done")).toBe(true);
  });

  it("en FAILED, rien ne tourne : le fait reste fait, le reste attend", () => {
    const p = meetingAnalysisProgress({
      status: "FAILED",
      updatedAt: later(60),
      analyses: [{ kind: "SONCAS", createdAt: later(10) }],
      scorecardApplicable: false,
    });

    expect(p.runningCount).toBe(0);
    expect(p.steps.map((s) => s.state)).toEqual([
      "done",
      "pending",
      "pending",
      "pending",
    ]);
  });
});
