import { describe, expect, it } from "@jest/globals";
import { kissResultSchema } from "./kiss-result-zod";

const minimal = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t"],
  goldenQuestion: "gq",
  coachingScore: 0,
  coachingScoreJustification: "because",
  summary: "summary text here",
};

describe("kissResultSchema", () => {
  it("accepts a minimal valid object", () => {
    const r = kissResultSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });

  it("rejects invalid coaching score", () => {
    expect(
      kissResultSchema.safeParse({ ...minimal, coachingScore: 11 }).success,
    ).toBe(false);
  });
});
