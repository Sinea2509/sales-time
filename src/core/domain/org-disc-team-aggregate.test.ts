import { describe, expect, it } from "@jest/globals";
import { averageDiscScores } from "./org-disc-team-aggregate";

describe("averageDiscScores", () => {
  it("returns null averages when input is empty or invalid", () => {
    const a = averageDiscScores([]);
    expect(Object.values(a).every((v) => v === null)).toBe(true);
    const b = averageDiscScores([{ foo: 1 }]);
    expect(Object.values(b).every((v) => v === null)).toBe(true);
  });

  it("averages D, I, S, C scores", () => {
    const out = averageDiscScores([
      { scores: { D: 40, I: 20, S: 20, C: 20 }, dominant: "D", evidence: [], summary: "a" },
      { scores: { D: 20, I: 40, S: 20, C: 20 }, dominant: "I", evidence: [], summary: "b" },
    ]);
    expect(out).toEqual({ D: 30, I: 30, S: 20, C: 20 });
  });
});
