import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("checkAiGatewayConfigured", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("returns AI_NOT_CONFIGURED when key is missing", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    const { checkAiGatewayConfigured } = await import("./env");
    expect(checkAiGatewayConfigured()).toEqual({
      ok: false,
      error: "AI_NOT_CONFIGURED",
    });
  });

  it("returns api key when configured", async () => {
    process.env.AI_GATEWAY_API_KEY = "gw-test";
    const { checkAiGatewayConfigured } = await import("./env");
    expect(checkAiGatewayConfigured()).toEqual({ ok: true, apiKey: "gw-test" });
  });
});
