import { describe, expect, it } from "@jest/globals";
import {
  meetingEtapeDisplayLabel,
  meetingEtapePillClass,
  meetingEtapePillClassForLabel,
  meetingEtapeScatterColorForLabel,
} from "./meeting-etape-pill";

describe("meeting-etape-pill", () => {
  it("prefers meetingType over pipelineStage", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: "Closing",
        pipelineStage: "Négociation",
      }),
    ).toBe("Closing");
  });

  it("falls back to pipelineStage when meetingType is empty", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: "Négociation",
      }),
    ).toBe("Négociation");
  });

  it("returns em dash when both fields are missing", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe("—");
  });

  it("styles known étape keywords consistently", () => {
    expect(meetingEtapePillClassForLabel("Proposition")).toContain("sky");
    expect(meetingEtapePillClassForLabel("Découverte")).toContain("emerald");
    expect(meetingEtapePillClassForLabel("Négociation")).toContain("rose");
    expect(meetingEtapeScatterColorForLabel("Closing")).toBe("#0ea5e9");
  });

  it("derives pill class from meeting fields", () => {
    expect(
      meetingEtapePillClass({
        meetingType: "Proposition",
        pipelineStage: null,
      }),
    ).toContain("sky");
  });
});
