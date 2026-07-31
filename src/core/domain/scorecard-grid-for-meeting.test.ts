import { DECOUVERTE_GRID, DEFAULT_SCORECARD_GRID } from "./scorecard-grid";
import {
  normalizeMeetingLabel,
  scorecardGridForMeeting,
} from "./scorecard-grid-for-meeting";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";

describe("normalizeMeetingLabel", () => {
  it("retire les accents, la casse et la ponctuation", () => {
    expect(normalizeMeetingLabel("RDV de Découverte !")).toBe(
      "rdv de decouverte",
    );
    expect(normalizeMeetingLabel("Démo / Proposition")).toBe(
      "demo proposition",
    );
    expect(normalizeMeetingLabel("R1")).toBe("r1");
  });

  it("réduit les espaces multiples à un seul", () => {
    expect(normalizeMeetingLabel("  Premier   rendez-vous  ")).toBe(
      "premier rendez vous",
    );
  });

  it("rend une chaîne vide pour une valeur absente", () => {
    expect(normalizeMeetingLabel(null)).toBe("");
    expect(normalizeMeetingLabel(undefined)).toBe("");
    expect(normalizeMeetingLabel("   ")).toBe("");
    expect(normalizeMeetingLabel("...")).toBe("");
  });
});

describe("scorecardGridForMeeting", () => {
  it("reconnaît la découverte sous ses noms courants", () => {
    for (const meetingType of [
      "Découverte",
      "découverte",
      "DÉCOUVERTE",
      "RDV de découverte client",
      "Discovery call",
      "Qualification",
      "Exploration",
      "Premier RDV",
      "Premier rendez-vous",
      "First meeting",
      "R1",
    ]) {
      expect(scorecardGridForMeeting({ meetingType })).toBe(DECOUVERTE_GRID);
    }
  });

  it("ne note pas un rendez-vous d'un autre genre", () => {
    for (const meetingType of [
      "Closing",
      "Négociation",
      "Démo",
      "Proposition",
      "Revue de compte",
      "Suivi client",
    ]) {
      expect(scorecardGridForMeeting({ meetingType })).toBeNull();
    }
  });

  it("exige le mot entier et non un fragment", () => {
    expect(scorecardGridForMeeting({ meetingType: "Redécouverte" })).toBeNull();
    expect(
      scorecardGridForMeeting({ meetingType: "Requalification" }),
    ).toBeNull();
    expect(scorecardGridForMeeting({ meetingType: "R12" })).toBeNull();
  });

  it("lit l'étape du pipeline quand le type est vide", () => {
    expect(
      scorecardGridForMeeting({
        meetingType: "   ",
        pipelineStage: "Découverte",
      }),
    ).toBe(DECOUVERTE_GRID);
    expect(
      scorecardGridForMeeting({ meetingType: null, pipelineStage: "Gagné" }),
    ).toBeNull();
  });

  it("laisse le type l'emporter sur l'étape du pipeline", () => {
    expect(
      scorecardGridForMeeting({
        meetingType: "Démo",
        pipelineStage: "Découverte",
      }),
    ).toBeNull();
    expect(
      scorecardGridForMeeting({
        meetingType: "Découverte",
        pipelineStage: "Négociation",
      }),
    ).toBe(DECOUVERTE_GRID);
  });

  it("applique la grille par défaut à un rendez-vous sans étape ni type", () => {
    expect(scorecardGridForMeeting({})).toBe(DEFAULT_SCORECARD_GRID);
    expect(
      scorecardGridForMeeting({ meetingType: null, pipelineStage: null }),
    ).toBe(DEFAULT_SCORECARD_GRID);
    expect(
      scorecardGridForMeeting({ meetingType: "", pipelineStage: "  " }),
    ).toBe(DEFAULT_SCORECARD_GRID);
  });

  it("reconnaît les types livrés par défaut qui sont des découvertes", () => {
    const notes = DEFAULT_MEETING_TYPES.filter(
      (meetingType) => scorecardGridForMeeting({ meetingType }) !== null,
    );
    expect(notes).toStrictEqual(["Qualification", "Découverte"]);
  });

  it("ne tire aucune grille des étapes de pipeline livrées par défaut", () => {
    // Elles qualifient l'affaire et non le rendez-vous : « Qualifié » dit
    // qu'une qualification a eu lieu, pas que ce rendez-vous en était une. Un
    // rendez-vous sans type dans une affaire ainsi rangée n'est donc pas noté,
    // et c'est le type de rendez-vous qui reste le seul signal fiable.
    for (const pipelineStage of DEFAULT_PIPELINE_STAGES) {
      expect(scorecardGridForMeeting({ pipelineStage })).toBeNull();
    }
  });
});
