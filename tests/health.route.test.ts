import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

type JestFn = ReturnType<typeof jest.fn>;

describe("GET /api/health", () => {
  let GET: typeof import("@/app/api/health/route").GET;
  let pingSelectOneMock: JestFn;

  beforeAll(async () => {
    jest.resetModules();
    pingSelectOneMock = jest.fn();
    jest.doMock("@/lib/application-deps", () => ({
      getApplicationDeps: () => ({
        platformHealth: { pingSelectOne: pingSelectOneMock },
      }),
    }));
    ({ GET } = await import("@/app/api/health/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ok without db check by default", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(pingSelectOneMock).not.toHaveBeenCalled();
  });

  it("pings database when db=1", async () => {
    pingSelectOneMock.mockResolvedValue(1);
    const response = await GET(
      new Request("http://localhost/api/health?db=1"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, db: true });
    expect(pingSelectOneMock).toHaveBeenCalled();
  });

  it("returns 503 when database ping fails", async () => {
    pingSelectOneMock.mockRejectedValue(new Error("down"));
    const response = await GET(
      new Request("http://localhost/api/health?db=1"),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      db: false,
      error: "database_unreachable",
    });
  });
});
