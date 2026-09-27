import {
  parseStatsRange,
  statsRangeLabel,
  statsRangeLengthDays,
  statsRangeToInput,
  statsRangeUntil,
} from "./stats-range";
import {
  meetingAtSinceForStatsWindow,
  previousMeetingAtWindowStart,
} from "./dashboard-stats-window";

const NOW = new Date("2026-09-27T10:00:00.000Z");

describe("parseStatsRange", () => {
  it("lit deux jours ISO et les borne", () => {
    const range = parseStatsRange("2026-08-01", "2026-08-31", NOW);
    expect(range).not.toBeNull();
    expect(statsRangeLengthDays(range!)).toBe(31);
    expect(statsRangeUntil(range!).toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
    expect(statsRangeToInput(range!)).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("refuse une fin avant le début, une date illisible, plus d'un an, ou un début futur", () => {
    expect(parseStatsRange("2026-08-31", "2026-08-01", NOW)).toBeNull();
    expect(parseStatsRange("2026-02-31", "2026-03-01", NOW)).toBeNull();
    expect(parseStatsRange("hier", "2026-03-01", NOW)).toBeNull();
    expect(parseStatsRange("2025-01-01", "2026-03-01", NOW)).toBeNull();
    expect(parseStatsRange("2026-10-01", "2026-10-15", NOW)).toBeNull();
    expect(parseStatsRange(undefined, "2026-03-01", NOW)).toBeNull();
  });

  it("se convertit en fenêtre glissante exacte pour les calculs existants", () => {
    const range = parseStatsRange("2026-08-01", "2026-08-31", NOW)!;
    const until = statsRangeUntil(range);
    const days = statsRangeLengthDays(range);
    expect(meetingAtSinceForStatsWindow(days, until).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z",
    );
    expect(previousMeetingAtWindowStart(days, until).toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
  });
});

describe("statsRangeLabel", () => {
  it("écrit la période en français, l'année une fois", () => {
    expect(statsRangeLabel({ from: "2026-08-01", to: "2026-08-31" })).toBe(
      "du 1er août au 31 août 2026",
    );
    expect(statsRangeLabel({ from: "2025-12-15", to: "2026-01-10" })).toBe(
      "du 15 décembre 2025 au 10 janvier 2026",
    );
  });
});
