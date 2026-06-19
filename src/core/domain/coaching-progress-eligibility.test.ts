import { describe, expect, it } from "@jest/globals";
import {
  coachingProgressBulletsForDisplay,
  MIN_ANALYZED_RDV_FOR_PROGRESS,
} from "./coaching-progress-eligibility";

describe("coachingProgressBulletsForDisplay", () => {
  const bullets = ["TAM en hausse de 12%."];

  it("hides progress bullets below the analyzed RDV threshold", () => {
    expect(MIN_ANALYZED_RDV_FOR_PROGRESS).toBe(2);
    expect(coachingProgressBulletsForDisplay(0, bullets)).toEqual([]);
    expect(coachingProgressBulletsForDisplay(1, bullets)).toEqual([]);
  });

  it("shows progress bullets from two analyzed RDV onward", () => {
    expect(coachingProgressBulletsForDisplay(2, bullets)).toEqual(bullets);
    expect(coachingProgressBulletsForDisplay(5, bullets)).toEqual(bullets);
  });
});
