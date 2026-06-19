import { isMeetingAnalysisStuck, MEETING_PROCESSING_STUCK_MS } from "./meeting-analysis-stuck";

describe("isMeetingAnalysisStuck", () => {
  const updatedAt = new Date("2026-01-01T12:00:00Z");

  it("returns false when status is not PROCESSING", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "READY",
        analysisCount: 0,
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS + 1,
      }),
    ).toBe(false);
  });

  it("returns false when analyses exist", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "PROCESSING",
        analysisCount: 1,
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS + 1,
      }),
    ).toBe(false);
  });

  it("returns false within the stuck window", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "PROCESSING",
        analysisCount: 0,
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS,
      }),
    ).toBe(false);
  });

  it("returns true when processing with no analyses past the window", () => {
    expect(
      isMeetingAnalysisStuck({
        status: "PROCESSING",
        analysisCount: 0,
        updatedAt,
        now: updatedAt.getTime() + MEETING_PROCESSING_STUCK_MS + 1,
      }),
    ).toBe(true);
  });
});
