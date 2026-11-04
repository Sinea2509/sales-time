import { describe, expect, it } from "@jest/globals";
import { DECOUVERTE_V2_GRID, scorecardCriteria } from "./scorecard-grid";
import {
  scorecardGeneratedListSchemaForGrid,
  scorecardGeneratedSchemaForGrid,
  scorecardListFormatInstruction,
  scorecardObservationsFromFields,
  scorecardObservationsFromList,
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

describe("scorecardGeneratedListSchemaForGrid", () => {
  const liste = KEYS.map((key) => ({ key, ...VIDE }));

  it("exige exactement un élément par critère, aux clés de la grille", () => {
    const schema = scorecardGeneratedListSchemaForGrid(KEYS);
    expect(schema.safeParse({ criteria: liste, ...COACHING }).success).toBe(
      true,
    );
    expect(
      schema.safeParse({ criteria: liste.slice(1), ...COACHING }).success,
    ).toBe(false);
    const inconnue = [...liste.slice(1), { ...liste[0], key: "Z9" }];
    expect(schema.safeParse({ criteria: inconnue, ...COACHING }).success).toBe(
      false,
    );
  });

  it("remet la liste dans l'ordre de la grille, sans doublon", () => {
    const aLEnvers = [...liste].reverse();
    const avecDoublon = [...aLEnvers, { ...liste[0], learned: "doublon" }];
    const obs = scorecardObservationsFromList(
      avecDoublon as Parameters<typeof scorecardObservationsFromList>[0],
      KEYS,
    );
    expect(obs.map((o) => o.key)).toEqual(KEYS);
    expect(obs[0].learned).toBe("");
  });

  it("annonce au modèle le nombre et l'ordre des critères", () => {
    const consigne = scorecardListFormatInstruction(KEYS);
    expect(consigne).toContain(`exactement ${KEYS.length} éléments`);
    expect(consigne).toContain(KEYS.join(", "));
  });
});
