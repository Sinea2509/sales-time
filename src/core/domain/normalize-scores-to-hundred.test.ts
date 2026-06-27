import { describe, expect, it } from "@jest/globals";
import { normalizeScoresToHundred } from "./normalize-scores-to-hundred";

describe("normalizeScoresToHundred", () => {
  it("returns empty for no keys", () => {
    expect(normalizeScoresToHundred({})).toEqual({});
  });

  it("sums to exactly 100", () => {
    const out = normalizeScoresToHundred({ D: 60, I: 50, S: 50, C: 40 });
    expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("preserves relative ordering", () => {
    const out = normalizeScoresToHundred({ D: 60, I: 50, S: 50, C: 40 });
    expect(out.D).toBeGreaterThan(out.C ?? 0);
  });

  it("splits evenly when all zero", () => {
    const out = normalizeScoresToHundred({ a: 0, b: 0, c: 0, d: 0 });
    expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
