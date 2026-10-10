import { describe, expect, it } from "@jest/globals";
import { DECOUVERTE_V2_GRID, scorecardCriteria } from "./scorecard-grid";
import {
  levelScorecardObservations,
  scorecardLevelFromCoverage,
} from "./scorecard-coverage";
import type { ScorecardGeneratedResult } from "./scorecard-result-zod";

const SELLER =
  "Comment ça se passe chez vous pour valider ce type de projet ?\nQui d'autre faut-il convaincre ?";
const PROSPECT =
  "Je vais voir avec Sandrine, c'est elle qui décide.\nOn a déjà essayé Cegos et on a été très déçus.";
const SOURCES = {
  all: `${SELLER}\n${PROSPECT}`,
  seller: SELLER,
  prospect: PROSPECT,
};

function releve(
  criteria: ScorecardGeneratedResult["criteria"],
): ScorecardGeneratedResult {
  return {
    criteria,
    pointsLost: [],
    summary: "S",
  };
}

describe("scorecardLevelFromCoverage", () => {
  it("lit la table : le thème abordé rapporte déjà, le thème creusé et obtenu vaut 4", () => {
    expect(scorecardLevelFromCoverage("non", "rien")).toBe(0);
    expect(scorecardLevelFromCoverage("aborde", "rien")).toBe(1);
    expect(scorecardLevelFromCoverage("creuse", "rien")).toBe(2);
    expect(scorecardLevelFromCoverage("non", "exploitable")).toBe(2);
    expect(scorecardLevelFromCoverage("aborde", "partiel")).toBe(2);
    expect(scorecardLevelFromCoverage("creuse", "partiel")).toBe(3);
    expect(scorecardLevelFromCoverage("creuse", "exploitable")).toBe(4);
  });
});

describe("levelScorecardObservations", () => {
  it("donne 4 à un thème creusé, avec la question du commercial et la réponse du prospect", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "C2",
          explored: "creuse",
          obtained: "exploitable",
          learned: "Sandrine décide.",
          missing: "",
          observable: true,
          evidence: [
            {
              who: "commercial",
              quote:
                "Comment ça se passe chez vous pour valider ce type de projet ?",
            },
            {
              who: "prospect",
              quote: "Je vais voir avec Sandrine, c'est elle qui décide.",
            },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(out.criteria[0]).toMatchObject({ key: "C2", level: 4 });
  });

  it("rend une citation à la personne qui l'a vraiment dite", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "C5",
          explored: "aborde",
          obtained: "exploitable",
          learned: "Cegos a déçu.",
          missing: "",
          observable: true,
          evidence: [
            {
              who: "commercial",
              quote: "On a déjà essayé Cegos et on a été très déçus.",
            },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    // La citation est du prospect : l'information obtenue tient.
    expect(out.criteria[0].level).toBe(3);
    expect(out.criteria[0].obtained).toBe("exploitable");
  });

  it("baisse d'un cran une information sans parole du prospect retrouvée, et « creusé » sans relance visible devient « abordé »", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "C1",
          explored: "creuse",
          obtained: "exploitable",
          learned: "",
          missing: "",
          observable: true,
          evidence: [
            { who: "commercial", quote: "Qui d'autre faut-il convaincre ?" },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(out.criteria[0].obtained).toBe("partiel");
    expect(out.criteria[0].explored).toBe("aborde");
    expect(out.criteria[0].level).toBe(2);
  });

  it("retire une citation introuvable et plafonne à 1 un critère sans preuve", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "B3",
          explored: "creuse",
          obtained: "exploitable",
          learned: "Coût chiffré.",
          missing: "",
          observable: true,
          evidence: [
            {
              who: "prospect",
              quote: "Ça nous coûte cent mille euros par an.",
            },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(out.criteria[0].evidence).toEqual([]);
    expect(out.criteria[0].level).toBe(1);
  });

  it("fixe l'écoute sur la mesure du produit, même quand le modèle l'a omise", () => {
    const out = levelScorecardObservations(
      releve([]),
      DECOUVERTE_V2_GRID,
      SOURCES,
      { E1: { level: 2, learned: "60 %.", missing: "Parler moins." } },
    );
    expect(out.criteria).toEqual([
      {
        key: "E1",
        level: 2,
        evidence: [],
        learned: "60 %.",
        missing: "Parler moins.",
      },
    ]);
  });

  it("ne garde que les clés de la grille, une fois chacune, et écarte les points perdus déjà au maximum", () => {
    const base = {
      explored: "creuse" as const,
      obtained: "exploitable" as const,
      learned: "",
      missing: "",
      observable: true,
      evidence: [
        { who: "prospect" as const, quote: "Je vais voir avec Sandrine" },
      ],
    };
    const out = levelScorecardObservations(
      {
        ...releve([
          { key: "C2", ...base },
          { key: "C2", ...base, explored: "non" },
          { key: "Z9", ...base },
        ]),
        pointsLost: [
          { key: "C2", evidence: "e", whatToSayInstead: "w" },
          { key: "B1", evidence: "e", whatToSayInstead: "w" },
        ],
      },
      DECOUVERTE_V2_GRID,
      { all: SOURCES.all, seller: null, prospect: null },
    );
    expect(out.criteria.map((c) => c.key)).toEqual(["C2"]);
    expect(out.pointsLost.map((p) => p.key)).toEqual(["B1"]);
  });

  it("compte vingt-cinq critères dans la grille de découverte, cadrage compris", () => {
    expect(scorecardCriteria(DECOUVERTE_V2_GRID)).toHaveLength(25);
  });
});
