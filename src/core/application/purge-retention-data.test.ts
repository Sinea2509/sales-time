import { describe, expect, it } from "@jest/globals";
import { purgeRetentionData } from "./purge-retention-data";

describe("purgeRetentionData", () => {
  it("purges ai logs and feedbacks older than 30 days", async () => {
    const aiLogs = { purgeOlderThan: jest.fn().mockResolvedValue(12) };
    const feedbacks = { purgeOlderThan: jest.fn().mockResolvedValue(3) };

    const result = await purgeRetentionData({ aiLogs, feedbacks } as never);

    expect(result.aiLogsPurged).toBe(12);
    expect(result.feedbacksPurged).toBe(3);
    expect(result.before).toBeInstanceOf(Date);

    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(result.before.getTime() - cutoffMs)).toBeLessThan(5000);
    expect(aiLogs.purgeOlderThan).toHaveBeenCalledWith(result.before);
    expect(feedbacks.purgeOlderThan).toHaveBeenCalledWith(result.before);
  });
});
