import { describe, expect, it } from "@jest/globals";
import { kissGeneratedResultSchema, kissResultSchema } from "./kiss-result-zod";

const minimal = {
  keep: ["k"],
  improve: ["i"],
  stop: ["s"],
  start: ["t"],
  goldenQuestion: "gq",
  coachingScore: 0,
  coachingScoreJustification: "because",
  summary: "summary text here",
};

const sellerSkills = {
  assertivite: 55,
  ecouteActive: 60,
  capitalSympathie: 45,
  argumentation: 70,
  objections: 50,
  nextSteps: 35,
};

describe("kissResultSchema", () => {
  it("accepts a minimal valid object", () => {
    const r = kissResultSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });

  it("rejects invalid coaching score", () => {
    expect(
      kissResultSchema.safeParse({ ...minimal, coachingScore: 11 }).success,
    ).toBe(false);
  });

  /*
    L'historique entier est fait de ces objets. S'il cessait d'être lisible, la
    fiche RDV, la matrice de qualification et les puces de coaching perdraient
    d'un coup des analyses qui existent toujours en base.
  */
  it("still reads an analysis stored before the seller scores existed", () => {
    const r = kissResultSchema.safeParse(minimal);
    expect(r.success).toBe(true);
    expect(r.success && r.data.sellerSkills).toBeUndefined();
  });

  it("keeps the seller scores when they are present", () => {
    const r = kissResultSchema.safeParse({ ...minimal, sellerSkills });
    expect(r.success && r.data.sellerSkills).toEqual(sellerSkills);
  });

  it("requires the seller scores from the model", () => {
    expect(kissGeneratedResultSchema.safeParse(minimal).success).toBe(false);
    expect(
      kissGeneratedResultSchema.safeParse({ ...minimal, sellerSkills }).success,
    ).toBe(true);
  });

  it("rejects a seller score outside the 0-100 range", () => {
    expect(
      kissGeneratedResultSchema.safeParse({
        ...minimal,
        sellerSkills: { ...sellerSkills, assertivite: 101 },
      }).success,
    ).toBe(false);
  });
});
