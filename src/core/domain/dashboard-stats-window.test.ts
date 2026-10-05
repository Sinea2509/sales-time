import { describe, expect, it } from "@jest/globals";
import {
  areAllStatsWindowsDisabled,
  disabledStatsWindowDays,
  meetingAtSinceForStatsWindow,
  MIN_RDV_FOR_STATS,
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
  resolveEligibleStatsWindowDays,
  STATS_WINDOW_DAYS_OPTIONS,
} from "./dashboard-stats-window";

describe("parseStatsWindowDays", () => {
  it("accepte 30, 90 et 365 (douze mois), comme la maquette", () => {
    expect(parseStatsWindowDays("30")).toBe(30);
    expect(parseStatsWindowDays("90")).toBe(90);
    expect(parseStatsWindowDays("365")).toBe(365);
  });

  it("ramène l'ancienne période de 7 jours à 30 jours", () => {
    expect(parseStatsWindowDays("7")).toBe(30);
  });

  it("uses first element when raw is an array", () => {
    expect(parseStatsWindowDays(["90", "365"])).toBe(90);
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
      const since = meetingAtSinceForStatsWindow(365);
      expect(since.getTime()).toBe(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const prev = previousMeetingAtWindowStart(365);
      expect(prev.getTime()).toBe(now.getTime() - 730 * 24 * 60 * 60 * 1000);
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

describe("disabledStatsWindowDays", () => {
  it("closes a window that has fewer meetings than the threshold", () => {
    const counts = {
      30: MIN_RDV_FOR_STATS - 1,
      90: MIN_RDV_FOR_STATS,
      365: MIN_RDV_FOR_STATS + 40,
    } as const;
    expect(disabledStatsWindowDays(counts)).toEqual([30]);
  });

  it("closes every window on a brand new account", () => {
    expect(disabledStatsWindowDays({ 30: 0, 90: 0, 365: 0 })).toEqual([
      ...STATS_WINDOW_DAYS_OPTIONS,
    ]);
  });
});

describe("areAllStatsWindowsDisabled", () => {
  it("says no as soon as one window can still be chosen", () => {
    expect(areAllStatsWindowsDisabled([30, 90])).toBe(false);
    expect(areAllStatsWindowsDisabled([])).toBe(false);
  });

  it("says yes when no window is left to choose", () => {
    expect(areAllStatsWindowsDisabled([...STATS_WINDOW_DAYS_OPTIONS])).toBe(
      true,
    );
  });

  it("is not fooled by a repeated window", () => {
    // Une liste de longueur 3 qui ne contient que deux fenêtres distinctes :
    // comparer les longueurs répondrait « plus rien à choisir », à tort.
    expect(areAllStatsWindowsDisabled([30, 30, 90])).toBe(false);
  });

  it("agrees with the counts it comes from", () => {
    const vide = { 30: 0, 90: 0, 365: 0 } as const;
    expect(areAllStatsWindowsDisabled(disabledStatsWindowDays(vide))).toBe(
      true,
    );
    const actif = { 30: 0, 90: 0, 365: MIN_RDV_FOR_STATS } as const;
    expect(areAllStatsWindowsDisabled(disabledStatsWindowDays(actif))).toBe(
      false,
    );
  });
});

describe("resolveEligibleStatsWindowDays", () => {
  it("keeps the requested window when it has enough meetings", () => {
    expect(
      resolveEligibleStatsWindowDays(30, {
        30: MIN_RDV_FOR_STATS,
        90: 0,
        365: 0,
      }),
    ).toBe(30);
  });

  it("falls back to the first window that has enough", () => {
    expect(
      resolveEligibleStatsWindowDays(30, {
        30: 1,
        90: 2,
        365: MIN_RDV_FOR_STATS,
      }),
    ).toBe(365);
  });

  it("returns the requested window when none has enough, so no redirect loops", () => {
    expect(resolveEligibleStatsWindowDays(90, { 30: 0, 90: 0, 365: 0 })).toBe(
      90,
    );
    expect(resolveEligibleStatsWindowDays(30, { 30: 0, 90: 0, 365: 0 })).toBe(
      30,
    );
  });
});
