import { describe, expect, it } from "@jest/globals";
import { percentChangeVsPrevious } from "./dashboard-trend";

describe("percentChangeVsPrevious", () => {
  it("returns null when both periods are zero", () => {
    expect(percentChangeVsPrevious(0, 0)).toBeNull();
  });

  it("returns null when previous is zero but current is not", () => {
    expect(percentChangeVsPrevious(5, 0)).toBeNull();
  });

  it("computes rounded percent change when previous is non-zero", () => {
    expect(percentChangeVsPrevious(150, 100)).toBe(50);
    expect(percentChangeVsPrevious(50, 100)).toBe(-50);
  });

  it("keeps a fall to zero measurable", () => {
    expect(percentChangeVsPrevious(0, 40)).toBe(-100);
  });
});
