import { describe, expect, it } from "@jest/globals";
import { salesScoreColorClass } from "./sales-score-color";

describe("salesScoreColorClass", () => {
  it("returns red below 50", () => {
    expect(salesScoreColorClass(49)).toContain("red");
  });

  it("returns amber from 50 to 69", () => {
    expect(salesScoreColorClass(50)).toContain("amber");
    expect(salesScoreColorClass(69)).toContain("amber");
  });

  it("returns green from 70", () => {
    expect(salesScoreColorClass(70)).toContain("emerald");
  });
});
