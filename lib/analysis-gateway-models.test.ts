import { describe, expect, it } from "@jest/globals";
import {
  ANALYSIS_GATEWAY_MODEL_OPTIONS,
  analysisGatewayModelSchema,
  gatewayModelLabel,
  isKnownGatewayModel,
} from "./analysis-gateway-models";

describe("analysisGatewayModelSchema", () => {
  it("accepts provider/model ids", () => {
    expect(analysisGatewayModelSchema.safeParse("openai/gpt-4o-mini").success).toBe(
      true,
    );
    expect(
      analysisGatewayModelSchema.safeParse("anthropic/claude-sonnet-4.6").success,
    ).toBe(true);
  });

  it("rejects invalid format", () => {
    expect(analysisGatewayModelSchema.safeParse("gpt-4o-mini").success).toBe(
      false,
    );
  });
});

describe("gateway model helpers", () => {
  it("labels known models", () => {
    const option = ANALYSIS_GATEWAY_MODEL_OPTIONS[0];
    expect(isKnownGatewayModel(option.id)).toBe(true);
    expect(gatewayModelLabel(option.id)).toContain(option.label);
  });

  it("falls back to raw id for unknown models", () => {
    expect(gatewayModelLabel("custom/provider-x")).toBe("custom/provider-x");
  });
});
