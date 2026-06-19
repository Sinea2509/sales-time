import { describe, expect, it } from "@jest/globals";
import { updateGlobalPromptModel } from "./update-global-prompt-model";

describe("updateGlobalPromptModel", () => {
  it("rejects non–super admin", async () => {
    const result = await updateGlobalPromptModel(
      {
        prompts: { updateModelForKind: async () => "openai/gpt-4o-mini" },
        audit: { logPlatformAction: async () => undefined },
      } as never,
      {
        actorInternalUserId: "u1",
        isSuperAdmin: false,
        kind: "SONCAS",
        model: "openai/gpt-4o-mini",
      },
    );
    expect(result).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
  });

  it("updates model for super admin", async () => {
    const updateModelForKind = async () => "anthropic/claude-sonnet-4.6";
    const logPlatformAction = async () => undefined;
    const result = await updateGlobalPromptModel(
      {
        prompts: { updateModelForKind },
        audit: { logPlatformAction },
      } as never,
      {
        actorInternalUserId: "u1",
        isSuperAdmin: true,
        kind: "DISC",
        model: "anthropic/claude-sonnet-4.6",
      },
    );
    expect(result).toEqual({
      ok: true,
      model: "anthropic/claude-sonnet-4.6",
    });
  });
});
