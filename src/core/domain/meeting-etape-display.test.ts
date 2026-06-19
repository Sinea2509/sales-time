import { describe, expect, it } from "@jest/globals";
import { meetingEtapeDisplayLabel } from "./meeting-etape-display";

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

  it("returns em dash when unset", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe("—");
  });
});
