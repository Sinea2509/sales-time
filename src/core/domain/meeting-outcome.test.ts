import { describe, expect, it } from "@jest/globals";
import { isMeetingOutcome, MEETING_OUTCOMES } from "./meeting-outcome";

describe("isMeetingOutcome", () => {
  it("narrows known outcomes", () => {
    for (const o of MEETING_OUTCOMES) {
      expect(isMeetingOutcome(o)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isMeetingOutcome("WON_NOT_REAL")).toBe(false);
  });
});
