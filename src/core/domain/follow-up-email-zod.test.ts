import { describe, expect, it } from "@jest/globals";
import { followUpEmailResultSchema } from "./follow-up-email-zod";

const valid = {
  subject: "Hello",
  greeting: "Hi",
  painPoints: "p",
  proposedSolutions: "s",
  nextSteps: "n",
  closing: "c",
};

describe("followUpEmailResultSchema", () => {
  it("parses a valid follow-up email object", () => {
    expect(followUpEmailResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty subject", () => {
    expect(
      followUpEmailResultSchema.safeParse({ ...valid, subject: "" }).success,
    ).toBe(false);
  });
});
