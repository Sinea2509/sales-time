import { describe, expect, it } from "@jest/globals";
import {
  meetingAtSinceForStatsWindow,
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "./dashboard-stats-window";

describe("parseStatsWindowDays", () => {
  it("accepts 7, 30, 90 as strings", () => {
    expect(parseStatsWindowDays("7")).toBe(7);
    expect(parseStatsWindowDays("30")).toBe(30);
    expect(parseStatsWindowDays("90")).toBe(90);
  });

  it("uses first element when raw is an array", () => {
    expect(parseStatsWindowDays(["90", "7"])).toBe(90);
  });

  it("defaults to 30 for undefined, empty, or invalid", () => {
    expect(parseStatsWindowDays(undefined)).toBe(30);
    expect(parseStatsWindowDays("")).toBe(30);
    expect(parseStatsWindowDays("14")).toBe(30);
    expect(parseStatsWindowDays(null as unknown as undefined)).toBe(30);
    expect(parseStatsWindowDays(true as unknown as string)).toBe(30);
  });
});

describe("meetingAtSinceForStatsWindow / previousMeetingAtWindowStart", () => {
  const now = new Date("2026-05-01T12:00:00.000Z");

  it("computes window start from explicit now", () => {
    const since = meetingAtSinceForStatsWindow(30, now);
    expect(since.getTime()).toBe(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev = previousMeetingAtWindowStart(30, now);
    expect(prev.getTime()).toBe(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  });

  it("defaults now to current time when omitted", () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    try {
      const since = meetingAtSinceForStatsWindow(7);
      expect(since.getTime()).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prev = previousMeetingAtWindowStart(7);
      expect(prev.getTime()).toBe(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("partitionMeetingsByStatsWindow", () => {
  const now = new Date("2026-05-01T12:00:00.000Z");

  it("splits meetings into current and previous windows", () => {
    const { currentWindow, previousWindow } = partitionMeetingsByStatsWindow(
      [
        { meetingAt: new Date("2026-04-20T00:00:00.000Z") },
        { meetingAt: new Date("2026-03-15T00:00:00.000Z") },
        { meetingAt: new Date("2026-02-01T00:00:00.000Z") },
      ],
      30,
      now,
    );
    expect(currentWindow).toHaveLength(1);
    expect(previousWindow).toHaveLength(1);
  });
});
