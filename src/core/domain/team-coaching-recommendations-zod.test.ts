import { describe, expect, it } from "@jest/globals";
import { teamCoachingRecommendationsSchema } from "./team-coaching-recommendations-zod";

describe("teamCoachingRecommendationsSchema", () => {
  it("accepts valid coaching bullet lists", () => {
    const parsed = teamCoachingRecommendationsSchema.safeParse({
      progressBullets: ["Continue discovery questions"],
      improvementBullets: ["Close with a next step"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty bullet arrays", () => {
    const parsed = teamCoachingRecommendationsSchema.safeParse({
      progressBullets: [],
      improvementBullets: ["One item"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects more than five bullets per list", () => {
    const parsed = teamCoachingRecommendationsSchema.safeParse({
      progressBullets: ["a", "b", "c", "d", "e", "f"],
      improvementBullets: ["x"],
    });
    expect(parsed.success).toBe(false);
  });
});
