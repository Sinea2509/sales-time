import { describe, expect, it } from "@jest/globals";
import {
  ETAPE_NON_RENSEIGNEE,
  meetingEtapeDisplayLabel,
} from "./meeting-etape-display";

describe("meetingEtapeDisplayLabel", () => {
  it("prefers meetingType over pipelineStage", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: "Closing",
        pipelineStage: "Négociation",
      }),
    ).toBe("Closing");
  });

  it("falls back to pipelineStage", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: "  ",
        pipelineStage: "Qualifié",
      }),
    ).toBe("Qualifié");
  });

  it("says the field is empty instead of drawing a dash", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe(ETAPE_NON_RENSEIGNEE);
    expect(ETAPE_NON_RENSEIGNEE).toBe("Non renseignée");
  });
});
