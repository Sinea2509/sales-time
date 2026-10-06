import { SCORECARD_LEVEL_MAX, SCORECARD_TOTAL } from "./scorecard-grid";
import {
  scorecardBlockScoreSchema,
  scorecardCriterionSchema,
  scorecardGeneratedResultSchema,
  scorecardPointLostSchema,
  scorecardResultSchema,
} from "./scorecard-result-zod";

const SORTIE = {
  criteria: [
    { key: "A1", level: 3, evidence: ["On est trente-deux au siège."] },
    { key: "A2", level: 0, evidence: [] },
  ],
  pointsLost: [
    {
      key: "A2",
      evidence: "Le commercial n'a demandé le nom de personne.",
      whatToSayInstead: "Qui d'autre que vous sera touché par ce changement ?",
    },
  ],
  keep: ["Bonne ouverture."],
  improve: ["Creuser le budget."],
  stop: ["Dérouler l'argumentaire produit."],
  goldenQuestion: "Que se passe-t-il si vous ne faites rien cette année ?",
  challenge: "Obtenir le nom du décideur au prochain rendez-vous.",
  summary: "Un rendez-vous correct sur le contexte, muet sur la décision.",
};

/** Ce que le modèle rend désormais : un relevé, sans niveau. */
const RELEVE = {
  ...SORTIE,
  criteria: [
    {
      key: "A1",
      explored: "creuse",
      obtained: "partiel",
      learned: "Le siège compte trente-deux personnes.",
      missing: "Les effectifs des sites restent inconnus.",
      observable: true,
      evidence: [{ who: "prospect", quote: "On est trente-deux au siège." }],
    },
    {
      key: "A2",
      explored: "non",
      obtained: "rien",
      learned: "",
      missing: "Qui intervient sur le sujet.",
      observable: true,
      evidence: [],
    },
  ],
};

describe("scorecardCriterionSchema", () => {
  it("borne le niveau sur l'échelle de la grille", () => {
    expect([
      scorecardCriterionSchema.shape.level.minValue,
      scorecardCriterionSchema.shape.level.maxValue,
    ]).toEqual([0, SCORECARD_LEVEL_MAX]);
  });

  it("refuse un niveau hors de l'échelle ou fractionnaire", () => {
    for (const level of [-1, SCORECARD_LEVEL_MAX + 1, 2.5]) {
      expect(
        scorecardCriterionSchema.safeParse({ key: "A1", level, evidence: [] })
          .success,
      ).toBe(false);
    }
  });

  it("refuse une clé vide ou trop longue pour en être une", () => {
    for (const key of ["", "A1-CONTEXTE"]) {
      expect(
        scorecardCriterionSchema.safeParse({ key, level: 1, evidence: [] })
          .success,
      ).toBe(false);
    }
  });

  it("n'accepte pas plus de trois citations", () => {
    expect(
      scorecardCriterionSchema.safeParse({
        key: "A1",
        level: 4,
        evidence: ["un", "deux", "trois", "quatre"],
      }).success,
    ).toBe(false);
  });
});

describe("scorecardPointLostSchema", () => {
  it("exige un constat et une formulation de remplacement", () => {
    expect(
      scorecardPointLostSchema.safeParse({
        key: "B3",
        evidence: "",
        whatToSayInstead: "Combien cela vous coûte-t-il par mois ?",
      }).success,
    ).toBe(false);
    expect(
      scorecardPointLostSchema.safeParse({
        key: "B3",
        evidence: "Le coût n'a jamais été chiffré.",
        whatToSayInstead: "",
      }).success,
    ).toBe(false);
  });
});

describe("scorecardGeneratedResultSchema", () => {
  it("accepte un relevé complet", () => {
    expect(scorecardGeneratedResultSchema.safeParse(RELEVE).success).toBe(true);
  });

  it("refuse un niveau rendu à la place du relevé", () => {
    expect(scorecardGeneratedResultSchema.safeParse(SORTIE).success).toBe(
      false,
    );
  });

  it("refuse une citation sans son auteur", () => {
    expect(
      scorecardGeneratedResultSchema.safeParse({
        ...RELEVE,
        criteria: [{ ...RELEVE.criteria[0], evidence: ["On est trente-deux."] }],
      }).success,
    ).toBe(false);
  });

  it("ne laisse passer aucun total rendu par le modèle", () => {
    const analyse = scorecardGeneratedResultSchema.parse({
      ...RELEVE,
      overallScore: 87,
      blocks: [{ key: "A", name: "Contexte", score: 18, max: 20 }],
      tier: "Excellence",
    });
    expect(analyse).not.toHaveProperty("overallScore");
    expect(analyse).not.toHaveProperty("blocks");
    expect(analyse).not.toHaveProperty("tier");
  });

  it("exige le relevé, les points perdus et la synthèse", () => {
    for (const champ of ["criteria", "pointsLost", "summary"]) {
      const partiel: Record<string, unknown> = { ...RELEVE };
      delete partiel[champ];
      expect(scorecardGeneratedResultSchema.safeParse(partiel).success).toBe(
        false,
      );
    }
  });

  it("ne demande plus de coaching à la grille, et refuse une synthèse vide", () => {
    const sansCoaching: Record<string, unknown> = { ...RELEVE };
    for (const champ of ["keep", "improve", "stop", "goldenQuestion", "challenge"]) {
      delete sansCoaching[champ];
    }
    expect(scorecardGeneratedResultSchema.safeParse(sansCoaching).success).toBe(
      true,
    );
    expect(
      scorecardGeneratedResultSchema.safeParse({ ...RELEVE, summary: "" })
        .success,
    ).toBe(false);
  });

  it("accepte une grille entièrement notée sans buter sur une borne", () => {
    expect(
      scorecardGeneratedResultSchema.safeParse({
        ...RELEVE,
        criteria: Array.from({ length: 26 }, (_, index) => ({
          key: `A${index}`,
          explored: "creuse",
          obtained: "exploitable",
          learned: "Un fait.",
          missing: "",
          observable: true,
          evidence: [{ who: "prospect", quote: "Une citation." }],
        })),
      }).success,
    ).toBe(true);
  });
});

describe("scorecardBlockScoreSchema", () => {
  it("n'accepte que des scores entiers dans l'échelle", () => {
    expect(
      scorecardBlockScoreSchema.safeParse({
        key: "A",
        name: "Contexte et compte",
        score: 18,
        max: 20,
      }).success,
    ).toBe(true);
    for (const score of [-1, 18.5, SCORECARD_TOTAL + 1]) {
      expect(
        scorecardBlockScoreSchema.safeParse({
          key: "A",
          name: "Contexte et compte",
          score,
          max: 20,
        }).success,
      ).toBe(false);
    }
  });

  it("refuse un bloc qui ne peut rien rapporter", () => {
    expect(
      scorecardBlockScoreSchema.safeParse({
        key: "A",
        name: "Contexte et compte",
        score: 0,
        max: 0,
      }).success,
    ).toBe(false);
  });
});

describe("scorecardResultSchema", () => {
  const ENREGISTRE = {
    ...SORTIE,
    gridId: "DECOUVERTE",
    gridName: "Rendez-vous de découverte",
    overallScore: 48,
    blocks: [{ key: "A", name: "Contexte et compte", score: 10, max: 20 }],
  };

  it("accepte une analyse enregistrée", () => {
    expect(scorecardResultSchema.safeParse(ENREGISTRE).success).toBe(true);
  });

  it("relit une analyse d'avant le relevé, qui ne porte que des niveaux", () => {
    expect(
      scorecardResultSchema.safeParse({
        ...ENREGISTRE,
        criteria: [{ key: "A1", level: 3, evidence: ["Un extrait."] }],
      }).success,
    ).toBe(true);
  });

  it("garde le relevé avec le niveau calculé", () => {
    const analyse = scorecardResultSchema.parse({
      ...ENREGISTRE,
      criteria: [
        {
          key: "A1",
          level: 3,
          evidence: ["On est trente-deux au siège."],
          explored: "creuse",
          obtained: "partiel",
          learned: "Trente-deux au siège.",
          missing: "Les sites.",
        },
      ],
    });
    expect(analyse.criteria[0].learned).toBe("Trente-deux au siège.");
  });

  it("garde tous les champs produits par le modèle", () => {
    const analyse = scorecardResultSchema.parse(ENREGISTRE);
    for (const champ of Object.keys(SORTIE)) {
      expect(analyse).toHaveProperty(champ);
    }
  });

  it("exige de savoir quelle grille a servi", () => {
    for (const champ of ["gridId", "gridName", "overallScore", "blocks"]) {
      const partiel: Record<string, unknown> = { ...ENREGISTRE };
      delete partiel[champ];
      expect(scorecardResultSchema.safeParse(partiel).success).toBe(false);
    }
  });

  it("borne le score global sur l'échelle du produit", () => {
    expect([
      scorecardResultSchema.shape.overallScore.minValue,
      scorecardResultSchema.shape.overallScore.maxValue,
    ]).toEqual([0, SCORECARD_TOTAL]);
    expect(
      scorecardResultSchema.safeParse({ ...ENREGISTRE, overallScore: 101 })
        .success,
    ).toBe(false);
  });
});
