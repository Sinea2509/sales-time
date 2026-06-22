import { describe, expect, it, afterEach } from "@jest/globals";
import { verifyCronSecret } from "./cron-auth";

describe("verifyCronSecret", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows requests in non-production when CRON_SECRET is unset", () => {
    process.env = { ...originalEnv, NODE_ENV: "development" };
    delete process.env.CRON_SECRET;

    const ok = verifyCronSecret(new Request("http://localhost/api/cron/purge-retention"));
    expect(ok).toBe(true);
  });

  it("rejects requests in production when CRON_SECRET is unset", () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.CRON_SECRET;

    const ok = verifyCronSecret(new Request("http://localhost/api/cron/purge-retention"));
    expect(ok).toBe(false);
  });

  it("accepts Bearer token matching CRON_SECRET", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      CRON_SECRET: "secret-token",
    };

    const ok = verifyCronSecret(
      new Request("http://localhost/api/cron/purge-retention", {
        headers: { authorization: "Bearer secret-token" },
      }),
    );
    expect(ok).toBe(true);
  });

  it("rejects wrong Bearer token", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      CRON_SECRET: "secret-token",
    };

    const ok = verifyCronSecret(
      new Request("http://localhost/api/cron/purge-retention", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    expect(ok).toBe(false);
  });
});
