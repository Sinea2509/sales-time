import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

jest.mock("@/src/core/application/process-analysis-jobs", () => ({
  processAnalysisJobs: jest.fn(),
}));

jest.mock("@/lib/env", () => ({
  checkAiGatewayConfigured: jest.fn(),
}));

jest.mock("@/lib/application-deps", () => ({
  getApplicationDeps: () => ({ analysisJobs: {} }),
}));

const afterMock = jest.fn((task: () => void | Promise<void>) => {
  void task();
});
jest.mock("next/server", () => ({ after: afterMock }));

const { processAnalysisJobs: processAnalysisJobsMock } = jest.requireMock(
  "@/src/core/application/process-analysis-jobs",
) as { processAnalysisJobs: JestFn };

const { checkAiGatewayConfigured: checkAiGatewayConfiguredMock } = jest.requireMock(
  "@/lib/env",
) as { checkAiGatewayConfigured: JestFn };

describe("scheduleAnalysisJobsAfterResponse", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    afterMock.mockClear();
    processAnalysisJobsMock.mockReset();
    processAnalysisJobsMock.mockResolvedValue({
      processed: 1,
      succeeded: 1,
      failed: 0,
      releasedStale: 0,
      reconciledMeetings: 0,
    });
    checkAiGatewayConfiguredMock.mockReset();
    checkAiGatewayConfiguredMock.mockReturnValue({ ok: true, apiKey: "gw" });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("runs processAnalysisJobs inside after()", async () => {
    const { scheduleAnalysisJobsAfterResponse } = await import(
      "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs"
    );
    scheduleAnalysisJobsAfterResponse();
    expect(afterMock).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(processAnalysisJobsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ workerId: expect.stringMatching(/^after-/) }),
    );
  });

  it("skips when AI gateway is not configured", async () => {
    checkAiGatewayConfiguredMock.mockReturnValue({
      ok: false,
      error: "AI_NOT_CONFIGURED",
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { scheduleAnalysisJobsAfterResponse } = await import(
      "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs"
    );
    scheduleAnalysisJobsAfterResponse();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(processAnalysisJobsMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
