import { describe, expect, it } from "@jest/globals";
import {
  ETAPE_NON_RENSEIGNEE,
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

  it("names the empty case, and keeps it neutral", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe(ETAPE_NON_RENSEIGNEE);
    // Une étape absente ne porte aucune des couleurs d'étape : elle ne se
    // range pas dans la progression Découverte, Proposition, Négociation.
    expect(meetingEtapePillClassForLabel(ETAPE_NON_RENSEIGNEE)).toContain(
      "zinc",
    );
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
