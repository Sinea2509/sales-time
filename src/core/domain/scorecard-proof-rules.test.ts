import { describe, expect, it } from "@jest/globals";
import { isConcrete, levelScorecardObservations } from "./scorecard-coverage";
import { DECOUVERTE_V2_GRID } from "./scorecard-grid";
import type { ScorecardGeneratedResult } from "./scorecard-result-zod";
import { openingNotRecorded } from "./talk-share-from-transcript";
import {
  evidenceWords,
  hasFigure,
  isExcerptInSource,
} from "./transcript-evidence";

/*
  Les règles de preuve du lot 92 : un nombre ne se remplace pas, un extrait
  fait trois mots au moins, ses morceaux se suivent, une citation ne sert
  qu'à un critère, et une citation tirée des notes ne vaut pas une parole du
  prospect.
*/

const SELLER = "Combien de managers sont concernés ?\nEt sur quels sites ?";
const PROSPECT =
  "On a 15 managers sur trois sites.\nOn travaille avec Cegos depuis longtemps.\nOui.";
const NOTES = "Budget annoncé en aparté : 40 000 euros pour la formation.";
const SOURCES = {
  all: `${SELLER}\n${PROSPECT}\n${NOTES}`,
  seller: SELLER,
  prospect: PROSPECT,
};

function releve(
  criteria: ScorecardGeneratedResult["criteria"],
): ScorecardGeneratedResult {
  return { criteria, pointsLost: [], summary: "S" };
}

const creuseExploitable = {
  explored: "creuse" as const,
  obtained: "exploitable" as const,
  learned: "",
  missing: "",
  observable: true,
};

describe("les citations, lot 92", () => {
  const source = evidenceWords(SOURCES.all);

  it("refuse un nombre changé, même quand le reste de la phrase est exact", () => {
    expect(isExcerptInSource("On a 15 managers sur trois sites", source)).toBe(
      true,
    );
    expect(isExcerptInSource("On a 50 managers sur trois sites", source)).toBe(
      false,
    );
    expect(isExcerptInSource("On a 15 managers sur deux sites", source)).toBe(
      false,
    );
    // Un mot ordinaire changé reste toléré.
    expect(isExcerptInSource("On a 15 managers sur trois lieux", source)).toBe(
      true,
    );
  });

  it("refuse un extrait de moins de trois mots", () => {
    expect(isExcerptInSource("Oui.", source)).toBe(false);
    expect(isExcerptInSource("quels sites", source)).toBe(false);
    expect(isExcerptInSource("sur quels sites", source)).toBe(true);
  });

  it("exige que les morceaux d'un extrait coupé se suivent dans le transcript", () => {
    expect(
      isExcerptInSource(
        "On a 15 managers sur trois sites… On travaille avec Cegos",
        source,
      ),
    ).toBe(true);
    // Les mêmes morceaux dans l'autre ordre ne font pas une citation.
    expect(
      isExcerptInSource(
        "On travaille avec Cegos… On a 15 managers sur trois sites",
        source,
      ),
    ).toBe(false);
  });

  it("reconnaît un chiffre dit, en chiffres ou en lettres, mais ni une année seule ni un nom de produit", () => {
    expect(hasFigure("On a une quarantaine de managers.")).toBe(true);
    expect(hasFigure("Quinze mille euros par an.")).toBe(true);
    expect(hasFigure("Sur 140 affaires.")).toBe(true);
    expect(hasFigure("On l'a fait en 2025.")).toBe(false);
    expect(hasFigure("On est sur Office 365.")).toBe(false);
    expect(hasFigure("Un projet neuf.")).toBe(false);
    expect(hasFigure("Une nouvelle équipe.")).toBe(false);
  });

  it("ne prend ni « en fin de compte » ni « l'année » seule pour une échéance, mais garde « l'année dernière »", () => {
    expect(isConcrete("En fin de compte, on verra.")).toBe(false);
    expect(isConcrete("C'est l'année qui a été dure.")).toBe(false);
    expect(isConcrete("On l'a fait l'année dernière.")).toBe(true);
    expect(isConcrete("Avant la fin du mois.")).toBe(true);
    // Une majuscule après une virgule n'est pas un nom propre.
    expect(isConcrete("Bon, Voilà ce que je pense.")).toBe(false);
    expect(isConcrete("Je vois ça avec Sandrine.")).toBe(true);
  });
});

describe("le relevé, lot 92", () => {
  it("ne compte pas une citation tirée des notes comme une parole du prospect", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "B5",
          ...creuseExploitable,
          evidence: [
            { who: "commercial", quote: "Combien de managers sont concernés" },
            {
              who: "prospect",
              quote:
                "Budget annoncé en aparté : 40 000 euros pour la formation.",
            },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    const b5 = out.criteria[0];
    // La citation est gardée, mais elle ne prouve ni réponse ni chiffre du prospect.
    expect(b5.evidence).toHaveLength(2);
    expect(b5.unproven).toBeUndefined();
    expect(b5).toMatchObject({
      explored: "aborde",
      obtained: "partiel",
      level: 2,
    });
  });

  it("n'accepte une même citation que pour un seul critère", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "A1",
          ...creuseExploitable,
          evidence: [
            { who: "commercial", quote: "Combien de managers sont concernés" },
            { who: "prospect", quote: "On a 15 managers sur trois sites." },
          ],
        },
        {
          key: "A2",
          ...creuseExploitable,
          evidence: [
            { who: "prospect", quote: "On a 15 managers sur trois sites." },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(out.criteria[0]).toMatchObject({ key: "A1", level: 4 });
    expect(out.criteria[1]).toMatchObject({
      key: "A2",
      evidence: [],
      unproven: true,
      level: 1,
    });
  });

  it("exige le chiffre exact pour le niveau 4 d'un critère qui l'exige", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "A1",
          ...creuseExploitable,
          evidence: [
            { who: "commercial", quote: "Combien de managers sont concernés" },
            { who: "prospect", quote: "On a 50 managers sur trois sites." },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    // Le chiffre recopié de travers rend la citation introuvable : plus de parole du prospect.
    expect(out.criteria[0].evidence).toEqual([
      "Combien de managers sont concernés",
    ]);
    expect(out.criteria[0].level).toBeLessThan(4);
  });

  it("repère « Enchanté » comme une ouverture, malgré l'accent", () => {
    const transcript = [
      "Lisa ANDROLUS   0:03",
      "Enchantée, merci de me recevoir.",
      "Cédric Laigneau   0:04",
      "Enchanté. On commence ?",
      "Lisa ANDROLUS   0:06",
      "Oui, allons-y sur la formation.",
      "Cédric Laigneau   0:10",
      "Comment ça se passe chez vous ?",
    ].join("\n");
    expect(
      openingNotRecorded(transcript, { sellerName: "Cédric Laigneau" }),
    ).toBe(false);
  });
});
