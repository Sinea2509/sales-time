import { describe, expect, it } from "@jest/globals";
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

  it("uses explicit now when provided", () => {
    const score = outreachPriorityScore({
      lastMeetingAt: new Date("2026-01-01T00:00:00.000Z"),
      meetingCount: 2,
      now: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("uses current time when now is omitted", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));
    try {
      const score = outreachPriorityScore({
        lastMeetingAt: new Date("1990-01-01T12:00:00.000Z"),
        meetingCount: 1,
      });
      expect(score).toBe(100);
    } finally {
      jest.useRealTimers();
    }
  });

  it("treats future last meeting as zero idle days", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const future = new Date("2027-01-01T12:00:00.000Z");
    const score = outreachPriorityScore({
      lastMeetingAt: future,
      meetingCount: 3,
      now,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("caps combined score at 100", () => {
    const now = new Date("2026-12-31T12:00:00.000Z");
    const veryOld = new Date("1990-01-01T12:00:00.000Z");
    const score = outreachPriorityScore({
      lastMeetingAt: veryOld,
      meetingCount: 999_999,
      now,
    });
    expect(score).toBe(100);
  });
});
