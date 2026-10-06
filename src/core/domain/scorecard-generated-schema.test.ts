import { describe, expect, it } from "@jest/globals";
import { DECOUVERTE_V2_GRID, scorecardCriteria } from "./scorecard-grid";
import {
  scorecardGeneratedSchemaForGrid,
  scorecardObservationsFromFields,
} from "./scorecard-result-zod";

const KEYS = scorecardCriteria(DECOUVERTE_V2_GRID).map((c) => c.key);
const VIDE = {
  explored: "non",
  obtained: "rien",
  learned: "",
  missing: "",
  observable: true,
  evidence: [],
};
const COACHING = {
  pointsLost: [],
  keep: [],
  improve: [],
  stop: [],
  goldenQuestion: "Q",
  challenge: "C",
  summary: "S",
};

describe("scorecardGeneratedSchemaForGrid", () => {
  it("exige un champ pour chaque critère de la grille", () => {
    const schema = scorecardGeneratedSchemaForGrid(KEYS);
    const complet = Object.fromEntries(KEYS.map((k) => [k, VIDE]));
    expect(schema.safeParse({ criteria: complet, ...COACHING }).success).toBe(
      true,
    );
    const incomplet = Object.fromEntries(
      Object.entries(complet).filter(([k]) => k !== "A4"),
    );
    expect(schema.safeParse({ criteria: incomplet, ...COACHING }).success).toBe(
      false,
    );
  });

  it("remet le relevé en liste, dans l'ordre de la grille", () => {
    const fields = Object.fromEntries(
      [...KEYS].reverse().map((k) => [k, VIDE]),
    ) as Parameters<typeof scorecardObservationsFromFields>[0];
    expect(
      scorecardObservationsFromFields(fields, KEYS).map((o) => o.key),
    ).toEqual(KEYS);
  });
});
