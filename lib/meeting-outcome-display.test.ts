import { describe, expect, it } from "@jest/globals";
import {
  MEETING_OUTCOME_OPTIONS,
  meetingOutcomeBadgeClass,
  meetingOutcomeLabel,
} from "./meeting-outcome-display";
import { MEETING_OUTCOMES } from "@/src/core/domain/meeting-outcome";

describe("meetingOutcomeLabel", () => {
  it("names every outcome of the domain", () => {
    for (const outcome of MEETING_OUTCOMES) {
      expect(meetingOutcomeLabel(outcome).trim().length).toBeGreaterThan(0);
    }
  });

  /*
    Deux résultats qui portent le même mot sont deux résultats que le lecteur
    ne peut pas distinguer. Le test lit la liste du domaine plutôt qu'une copie,
    pour qu'un sixième résultat ajouté sans libellé casse ici.
  */
  it("gives each outcome a word of its own", () => {
    const labels = MEETING_OUTCOMES.map(meetingOutcomeLabel);
    expect(new Set(labels).size).toBe(MEETING_OUTCOMES.length);
  });

  it("falls back to Autre rather than showing a technical value", () => {
    expect(meetingOutcomeLabel("PAS_UN_RESULTAT")).toBe("Autre");
    expect(meetingOutcomeLabel("")).toBe("Autre");
  });
});

describe("meetingOutcomeBadgeClass", () => {
  /*
    « Absent » et « Autre » partageaient le gris chez l'administrateur : un
    rendez-vous manqué s'y lisait comme un rendez-vous sans issue notable.
  */
  it("gives each outcome a hue of its own", () => {
    const classes = MEETING_OUTCOMES.map(meetingOutcomeBadgeClass);
    expect(new Set(classes).size).toBe(MEETING_OUTCOMES.length);
  });

  it("leaves the brand hue to the product", () => {
    for (const outcome of MEETING_OUTCOMES) {
      expect(meetingOutcomeBadgeClass(outcome)).not.toContain("brand");
      expect(meetingOutcomeBadgeClass(outcome).toLowerCase()).not.toContain(
        "6c4dff",
      );
    }
  });

  it("falls back to the Autre style on an unknown value", () => {
    expect(meetingOutcomeBadgeClass("PAS_UN_RESULTAT")).toBe(
      meetingOutcomeBadgeClass("OTHER"),
    );
  });
});

describe("MEETING_OUTCOME_OPTIONS", () => {
  it("offers the five outcomes in the order of the domain", () => {
    expect(MEETING_OUTCOME_OPTIONS.map((o) => o.value)).toEqual([
      ...MEETING_OUTCOMES,
    ]);
    for (const option of MEETING_OUTCOME_OPTIONS) {
      expect(option.label).toBe(meetingOutcomeLabel(option.value));
    }
  });
});
