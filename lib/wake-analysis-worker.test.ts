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

  it("prefers VERCEL_URL over APP_BASE_URL", async () => {
    process.env = {
      ...originalEnv,
      VERCEL_URL: "deploy-abc.vercel.app",
      APP_BASE_URL: "https://app.example.com",
      CRON_SECRET: "cron-test",
    };
    const { wakeAnalysisWorker } = await import("./wake-analysis-worker");
    wakeAnalysisWorker();
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/worker/process-jobs", "https://deploy-abc.vercel.app"),
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer cron-test" },
      }),
    );
  });

  it("falls back to APP_BASE_URL when VERCEL_URL is unset", async () => {
    process.env = {
      ...originalEnv,
      APP_BASE_URL: "https://app.example.com",
      CRON_SECRET: "cron-test",
    };
    delete process.env.VERCEL_URL;
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

  it("logs non-2xx worker responses", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '{"error":"AI_NOT_CONFIGURED"}',
    });
    process.env = {
      ...originalEnv,
      APP_BASE_URL: "https://app.example.com",
      CRON_SECRET: "cron-test",
    };
    delete process.env.VERCEL_URL;
    const { wakeAnalysisWorker } = await import("./wake-analysis-worker");
    wakeAnalysisWorker();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalledWith(
      "wakeAnalysisWorker: worker returned",
      503,
      '{"error":"AI_NOT_CONFIGURED"}',
    );
    errorSpy.mockRestore();
  });

  it("no-ops in production when CRON_SECRET is missing", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      APP_BASE_URL: "https://app.example.com",
    };
    delete process.env.CRON_SECRET;
    delete process.env.VERCEL_URL;
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

describe("scheduleAnalysisWorkerWake", () => {
  const originalEnv = { ...process.env };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fetch mock
  const fetchMock = jest.fn() as jest.Mock<any>;
  fetchMock.mockResolvedValue({ ok: true });
  const afterMock = jest.fn((task: () => void) => {
    task();
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.doMock("next/server", () => ({ after: afterMock }));
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockClear();
    afterMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.dontMock("next/server");
  });

  it("registers wakeAnalysisWorker via after()", async () => {
    process.env = {
      ...originalEnv,
      APP_BASE_URL: "https://app.example.com",
      CRON_SECRET: "cron-test",
    };
    delete process.env.VERCEL_URL;
    const { scheduleAnalysisWorkerWake } = await import("./wake-analysis-worker");
    scheduleAnalysisWorkerWake();
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/worker/process-jobs", "https://app.example.com"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
