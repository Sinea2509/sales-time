import { describe, expect, it } from "@jest/globals";
import {
  averageTamMinutes,
  countConnectedMeetings,
  isConnectedMeetingDuration,
  prospectingMinutesForStatsWindow,
  sumUsefulConversationMinutes,
  tucOptimisePercent,
} from "./dashboard-tam-tuc";

describe("dashboard-tam-tuc", () => {
  it("isConnectedMeetingDuration ignores null and zero", () => {
    expect(isConnectedMeetingDuration(null)).toBe(false);
    expect(isConnectedMeetingDuration(0)).toBe(false);
    expect(isConnectedMeetingDuration(12)).toBe(true);
  });

  it("averageTamMinutes only averages connected calls", () => {
    expect(averageTamMinutes([10, null, 0, 20])).toBe(15);
    expect(averageTamMinutes([null, 0])).toBeNull();
  });

  it("sumUsefulConversationMinutes sums connected durations", () => {
    expect(sumUsefulConversationMinutes([10, null, 5, 0])).toBe(15);
  });

  it("countConnectedMeetings counts only connected calls", () => {
    expect(countConnectedMeetings([10, null, 5, 0])).toBe(2);
    expect(countConnectedMeetings([null, 0])).toBe(0);
  });

  it("prospectingMinutesForStatsWindow prorates monthly objective", () => {
    expect(prospectingMinutesForStatsWindow(180, 30)).toBe(180);
    expect(prospectingMinutesForStatsWindow(180, 7)).toBe(42);
  });

  it("tucOptimisePercent caps at 100", () => {
    expect(tucOptimisePercent(90, 180)).toBe(50);
    expect(tucOptimisePercent(300, 180)).toBe(100);
    expect(tucOptimisePercent(10, 0)).toBeNull();
  });
});
