import {
  isMeetingAnalysisSlow,
  isMeetingAnalysisStuck,
  MEETING_PROCESSING_SLOW_MS,
  MEETING_PROCESSING_STUCK_MS,
} from "./meeting-analysis-stuck";

describe("isMeetingAnalysisSlow", () => {
  const updatedAt = new Date("2026-01-01T12:00:00Z");

  it("returns false when status is not PROCESSING", () => {
    expect(
      isMeetingAnalysisSlow({
        status: "READY",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_SLOW_MS + 1,
      }),
    ).toBe(false);
  });

  it("returns false within the slow window", () => {
    expect(
      isMeetingAnalysisSlow({
        status: "PROCESSING",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_SLOW_MS,
      }),
    ).toBe(false);
  });

  it("returns true when processing past the slow window", () => {
    expect(
      isMeetingAnalysisSlow({
        status: "PROCESSING",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_SLOW_MS + 1,
      }),
    ).toBe(true);
  });
});

describe("isMeetingAnalysisStuck", () => {
  const updatedAt = new Date("2026-01-01T12:00:00Z");

  it("returns false when status is not PROCESSING", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "READY",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS + 1,
      }),
    ).toBe(false);
  });

  it("returns false within the stuck window", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "PROCESSING",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS,
      }),
    ).toBe(false);
  });

  it("returns true when processing past the window", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "PROCESSING",
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS + 1,
      }),
    ).toBe(true);
  });
});
