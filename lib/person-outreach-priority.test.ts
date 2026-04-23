import { describe, expect, it } from "vitest";
import { outreachPriorityScore } from "./person-outreach-priority";

describe("outreachPriorityScore", () => {
  const now = new Date("2026-04-23T12:00:00.000Z");

  it("increases with idle days and meeting volume", () => {
    const recent = new Date("2026-04-22T12:00:00.000Z");
    const old = new Date("2026-03-01T12:00:00.000Z");
    const low = outreachPriorityScore({
      lastMeetingAt: recent,
      meetingCount: 1,
      now,
    });
    const high = outreachPriorityScore({
      lastMeetingAt: old,
      meetingCount: 5,
      now,
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(100);
  });
});
