import { describe, expect, it } from "@jest/globals";
import {
  applyScorecardEvidenceRule,
  keepKnownScorecardKeys,
  SCORECARD_UNPROVEN_LEVEL_MAX,
} from "./scorecard-evidence-rule";
import { scorecardGridForMeeting } from "./scorecard-grid-for-meeting";
import type { ScorecardLeveledResult } from "./scorecard-result-zod";

const TRANSCRIPT = `Claire : Le chiffre d'affaires tient, mais la marge baisse. Nous sommes passés de 34 % de marge brute à 29 % en deux ans.
Claire : Marc Vermont, le directeur général. C'est lui qui signe.
Julien : Merci Claire, merci de me recevoir.`;

function result(
  criteria: ScorecardLeveledResult["criteria"],
): ScorecardLeveledResult {
  return {
    criteria,
    pointsLost: [],
    keep: [],
    improve: [],
    stop: [],
    goldenQuestion: "q",
    challenge: "c",
    summary: "s",
  };
}

describe("applyScorecardEvidenceRule", () => {
  it("retire une définition recopiée et plafonne le critère resté sans preuve", () => {
    const checked = applyScorecardEvidenceRule(
      result([
        {
          key: "B1",
          level: 4,
          evidence: ["Ce qui fait que le prospect s'en occupe maintenant"],
        },
      ]),
      TRANSCRIPT,
    );
    expect(checked.criteria[0]).toEqual({
      key: "B1",
      level: SCORECARD_UNPROVEN_LEVEL_MAX,
      evidence: [],
    });
  });

  it("garde le niveau d'un critère dont une preuve au moins est retrouvée", () => {
    const checked = applyScorecardEvidenceRule(
      result([
        {
          key: "C1",
          level: 4,
          evidence: [
            "C'est lui qui signe",
            "Il a tout validé la semaine dernière",
          ],
        },
      ]),
      TRANSCRIPT,
    );
    expect(checked.criteria[0]).toEqual({
      key: "C1",
      level: 4,
      evidence: ["C'est lui qui signe"],
    });
  });

  it("ne touche ni un niveau bas sans preuve, ni un résultat entièrement appuyé", () => {
    const sansCorrection = result([
      { key: "A1", level: 1, evidence: [] },
      { key: "B3", level: 3, evidence: ["de 34 % de marge brute à 29 %"] },
    ]);
    expect(applyScorecardEvidenceRule(sansCorrection, TRANSCRIPT)).toBe(
      sansCorrection,
    );
  });

  it("lit les preuves dans les notes aussi, quand elles font partie de la source", () => {
    const checked = applyScorecardEvidenceRule(
      result([
        { key: "D1", level: 4, evidence: ["relance prévue le 7 octobre"] },
      ]),
      `${TRANSCRIPT}\nNotes : relance prévue le 7 octobre`,
    );
    expect(checked.criteria[0]?.level).toBe(4);
  });
});

describe("keepKnownScorecardKeys", () => {
  const grid = scorecardGridForMeeting({
    meetingType: "Découverte",
    pipelineStage: null,
  })!;

  it("retire les clés inventées, dans les critères comme dans les points perdus", () => {
    const base = result([
      { key: "A1", level: 4, evidence: ["Nous sommes neuf commerciaux"] },
      { key: "A6", level: 0, evidence: [] },
    ]);
    const kept = keepKnownScorecardKeys(
      {
        ...base,
        pointsLost: [
          { key: "A6", evidence: "rien", whatToSayInstead: "demander" },
          { key: "B6", evidence: "rien", whatToSayInstead: "demander" },
        ],
      },
      grid,
    );
    expect(kept.criteria.map((c) => c.key)).toEqual(["A1"]);
    expect(kept.pointsLost.map((p) => p.key)).toEqual(["B6"]);
  });

  it("rend le même objet quand toutes les clés sont connues", () => {
    const base = result([{ key: "A1", level: 2, evidence: [] }]);
    expect(keepKnownScorecardKeys(base, grid)).toBe(base);
  });
});
