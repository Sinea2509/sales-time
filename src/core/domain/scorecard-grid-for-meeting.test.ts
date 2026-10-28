import {
  DECOUVERTE_V2_GRID as DECOUVERTE_GRID,
  DEFAULT_SCORECARD_GRID,
  SUIVI_GRID,
} from "./scorecard-grid";
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

  it("note les rendez-vous qui suivent la découverte sur la grille de suivi", () => {
    for (const meetingType of [
      "Démo",
      "Démonstration produit",
      "Proposition",
      "Négociation",
      "Closing",
      "Soutenance",
      "R2",
      "Second rendez-vous",
      "RDV de suivi",
    ]) {
      expect(scorecardGridForMeeting({ meetingType })).toBe(SUIVI_GRID);
    }
  });

  it("ne note pas un rendez-vous qui n'est pas un rendez-vous de vente", () => {
    for (const meetingType of [
      "Revue de compte",
      "Suivi client",
      "Point annuel",
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
    ).toBe(SUIVI_GRID);
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

  it("note tous les types livrés par défaut, sauf la revue de compte", () => {
    const notes = DEFAULT_MEETING_TYPES.filter(
      (meetingType) => scorecardGridForMeeting({ meetingType }) !== null,
    );
    expect(notes).toStrictEqual([
      "Qualification",
      "Découverte",
      "Démo",
      "Proposition",
      "Négociation",
      "Closing",
    ]);
  });

  it("ne tire des étapes livrées par défaut que la grille de suivi", () => {
    // « Qualifié » dit qu'une qualification a eu lieu, pas que ce rendez-vous
    // en était une : pas de note. « Démo / Proposition » et « Négociation »
    // nomment au contraire le rendez-vous qu'on y tient.
    const grilles = Object.fromEntries(
      DEFAULT_PIPELINE_STAGES.map((pipelineStage) => [
        pipelineStage,
        scorecardGridForMeeting({ pipelineStage })?.id ?? null,
      ]),
    );
    expect(grilles).toStrictEqual({
      "Lead entrant": null,
      Qualifié: null,
      "Démo / Proposition": "SUIVI",
      Négociation: "SUIVI",
      Gagné: null,
    });
  });
});
