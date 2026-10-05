import { describe, expect, it } from "@jest/globals";
import { STABLE_SEED, stableCallSettings } from "./stable-call-settings";

describe("stableCallSettings", () => {
  it("fixe la température à zéro et la graine pour les modèles qui l'acceptent", () => {
    expect(stableCallSettings("openai/gpt-4o-mini")).toEqual({
      temperature: 0,
      seed: STABLE_SEED,
    });
    expect(stableCallSettings("anthropic/claude-sonnet-4.6")).toEqual({
      temperature: 0,
      seed: STABLE_SEED,
    });
  });

  it("ne règle que la graine des modèles à raisonnement, qui refusent la température", () => {
    expect(stableCallSettings("openai/gpt-5.4")).toEqual({ seed: STABLE_SEED });
  });
});
