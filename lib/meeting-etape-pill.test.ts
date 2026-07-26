import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import {
  ETAPE_NON_RENSEIGNEE,
  etapeVocabularyFromOptions,
  meetingEtapeDisplayLabel,
  meetingEtapePillClass,
  meetingEtapePillClassForLabel,
  sortEtapesByVocabulary,
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

  it("names the empty case", () => {
    expect(
      meetingEtapeDisplayLabel({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe(ETAPE_NON_RENSEIGNEE);
  });

  it("gives every filled étape the same pill, whatever its wording", () => {
    // Le test qui compte : deux étapes différentes doivent porter la MÊME
    // pastille. Un classeur par mots-clés reviendrait à donner une couleur à
    // « Proposition » et pas à « Discovery call », et casserait ces égalités.
    const reference = meetingEtapePillClassForLabel("Proposition");
    expect(meetingEtapePillClassForLabel("Découverte")).toBe(reference);
    expect(meetingEtapePillClassForLabel("Négociation")).toBe(reference);
    expect(meetingEtapePillClassForLabel("Discovery call")).toBe(reference);
    expect(meetingEtapePillClassForLabel("Étape maison n° 4")).toBe(reference);
  });

  it("marks the absent étape by its outline, not by a hue", () => {
    const absente = meetingEtapePillClassForLabel(ETAPE_NON_RENSEIGNEE);
    const remplie = meetingEtapePillClassForLabel("Proposition");

    expect(absente).not.toBe(remplie);
    expect(absente).toContain("border-dashed");
    expect(remplie).not.toContain("dashed");
  });

  it("keeps both pills on theme tokens, with no palette hue", () => {
    // Une teinte en dur ne suivrait ni le mode sombre ni le thème d'une
    // organisation. Les deux pastilles ne doivent citer aucune couleur.
    for (const classe of [
      meetingEtapePillClassForLabel("Proposition"),
      meetingEtapePillClassForLabel(ETAPE_NON_RENSEIGNEE),
    ]) {
      expect(classe).not.toMatch(/#|sky|emerald|rose|zinc|amber|violet/);
    }
  });

  it("derives pill class from meeting fields", () => {
    expect(
      meetingEtapePillClass({
        meetingType: "Proposition",
        pipelineStage: null,
      }),
    ).toBe(meetingEtapePillClassForLabel("Proposition"));

    expect(
      meetingEtapePillClass({
        meetingType: null,
        pipelineStage: null,
      }),
    ).toBe(meetingEtapePillClassForLabel(ETAPE_NON_RENSEIGNEE));
  });
});

describe("etapeVocabularyFromOptions", () => {
  it("lists meeting types first, then the pipeline stages", () => {
    const vocabulaire = etapeVocabularyFromOptions();

    expect(vocabulaire.slice(0, DEFAULT_MEETING_TYPES.length)).toEqual([
      ...DEFAULT_MEETING_TYPES,
    ]);
    expect(vocabulaire.indexOf("Lead entrant")).toBeGreaterThan(
      vocabulaire.indexOf("Revue de compte"),
    );
  });

  it("keeps a label present in both lists at its first rank, once", () => {
    // « Négociation » figure dans les deux listes installées par défaut.
    const vocabulaire = etapeVocabularyFromOptions();

    expect(vocabulaire.filter((l) => l === "Négociation")).toHaveLength(1);
    expect(vocabulaire.indexOf("Négociation")).toBe(
      DEFAULT_MEETING_TYPES.indexOf("Négociation"),
    );
  });

  it("falls back to the shipped lists when an option list is empty or absent", () => {
    expect(
      etapeVocabularyFromOptions({
        meetingTypeOptions: [],
        pipelineStageOptions: [],
      }),
    ).toEqual(etapeVocabularyFromOptions());

    // Chaque liste retombe pour son compte : réécrire les types de rendez-vous
    // ne fait pas disparaître les étapes de pipeline.
    expect(
      etapeVocabularyFromOptions({
        meetingTypeOptions: ["Premier contact"],
        pipelineStageOptions: null,
      }),
    ).toEqual(["Premier contact", ...DEFAULT_PIPELINE_STAGES]);
  });

  it("trims, drops the blanks, and keeps a duplicate at its first rank", () => {
    expect(
      etapeVocabularyFromOptions({
        meetingTypeOptions: ["  Discovery  ", "Demo", "   ", "Demo"],
        pipelineStageOptions: ["Won", "Discovery"],
      }),
    ).toEqual(["Discovery", "Demo", "Won"]);
  });
});

describe("sortEtapesByVocabulary", () => {
  const VOCABULAIRE = ["Qualification", "Découverte", "Démo", "Proposition"];

  it("follows the organization order, not the alphabet", () => {
    expect(
      sortEtapesByVocabulary(
        ["Proposition", "Découverte", "Qualification"],
        VOCABULAIRE,
      ),
    ).toEqual(["Qualification", "Découverte", "Proposition"]);
  });

  it("puts what the vocabulary no longer holds after what it holds", () => {
    expect(
      sortEtapesByVocabulary(["Atelier", "Proposition"], VOCABULAIRE),
    ).toEqual(["Proposition", "Atelier"]);
  });

  it("sorts the strangers with French collation", () => {
    // Comparées sur leurs codes, « Événement » passerait après « Signature ».
    expect(sortEtapesByVocabulary(["Signature", "Événement"], [])).toEqual([
      "Événement",
      "Signature",
    ]);
  });

  it("closes the march with the absent étape, even if listed first", () => {
    expect(
      sortEtapesByVocabulary(
        ["Proposition", ETAPE_NON_RENSEIGNEE],
        [ETAPE_NON_RENSEIGNEE, "Proposition"],
      ),
    ).toEqual(["Proposition", ETAPE_NON_RENSEIGNEE]);
  });

  it("leaves the given array untouched", () => {
    const entree = ["Proposition", "Qualification"];
    const sortie = sortEtapesByVocabulary(entree, VOCABULAIRE);

    expect(entree).toEqual(["Proposition", "Qualification"]);
    expect(sortie).not.toBe(entree);
  });
});
