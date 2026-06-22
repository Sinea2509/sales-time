import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

describe("wakeAnalysisWorker", () => {
  const originalEnv = { ...process.env };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fetch mock
  const fetchMock = jest.fn() as jest.Mock<any>;
  fetchMock.mockResolvedValue({ ok: true });

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calls the worker on the app base URL with cron auth", async () => {
    process.env = {
      ...originalEnv,
      APP_BASE_URL: "https://app.example.com",
      CRON_SECRET: "cron-test",
    };
    const { wakeAnalysisWorker } = await import("./wake-analysis-worker");
    wakeAnalysisWorker();
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/worker/process-jobs", "https://app.example.com"),
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer cron-test" },
      }),
    );
  });

  it("no-ops in production when CRON_SECRET is missing", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      APP_BASE_URL: "https://app.example.com",
    };
    delete process.env.CRON_SECRET;
    const { wakeAnalysisWorker } = await import("./wake-analysis-worker");
    wakeAnalysisWorker();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses localhost in development without cron secret", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
    };
    delete process.env.APP_BASE_URL;
    delete process.env.VERCEL_URL;
    delete process.env.CRON_SECRET;
    const { wakeAnalysisWorker } = await import("./wake-analysis-worker");
    wakeAnalysisWorker();
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/worker/process-jobs", "http://localhost:3000"),
      expect.objectContaining({ method: "GET", headers: {} }),
    );
  });
});
