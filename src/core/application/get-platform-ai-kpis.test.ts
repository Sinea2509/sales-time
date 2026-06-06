import { describe, expect, it } from "@jest/globals";
import { getPlatformAiKpis } from "./get-platform-ai-kpis";

describe("getPlatformAiKpis", () => {
  it("computes cost estimate and failure rate from aggregates", async () => {
    const since = new Date("2026-05-01T00:00:00.000Z");
    const deps = {
      aiLogs: {
        getAggregateSince: jest.fn().mockResolvedValue({
          totalCalls: 100,
          errorCalls: 5,
          inputTokens: 1_000_000,
          outputTokens: 200_000,
        }),
      },
      meetings: {
        countByAnalysisStatus: jest
          .fn()
          .mockResolvedValue({ ready: 80, failed: 20 }),
      },
    };

    const kpis = await getPlatformAiKpis(deps as never, since);

    expect(deps.aiLogs.getAggregateSince).toHaveBeenCalledWith(since);
    expect(kpis.aiCalls30d).toBe(100);
    expect(kpis.aiErrors30d).toBe(5);
    expect(kpis.readyMeetings).toBe(80);
    expect(kpis.failedMeetings).toBe(20);
    expect(kpis.analysisFailureRatePct).toBe(20);
    // 1M * 0.000002 + 200k * 0.000008 = 2 + 1.6 = 3.6
    expect(kpis.estimatedCostUsd30d).toBe(3.6);
  });

  it("returns null failure rate when no analysed meetings", async () => {
    const deps = {
      aiLogs: {
        getAggregateSince: jest.fn().mockResolvedValue({
          totalCalls: 0,
          errorCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
        }),
      },
      meetings: {
        countByAnalysisStatus: jest
          .fn()
          .mockResolvedValue({ ready: 0, failed: 0 }),
      },
    };

    const kpis = await getPlatformAiKpis(deps as never, new Date());
    expect(kpis.analysisFailureRatePct).toBeNull();
    expect(kpis.estimatedCostUsd30d).toBe(0);
  });
});
