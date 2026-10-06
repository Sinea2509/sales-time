import { describe, expect, it } from "@jest/globals";
import {
  conversationCaps,
  questioningCap,
  questioningMeasure,
} from "./conversation-caps";
import { levelScorecardObservations } from "./scorecard-coverage";
import { DECOUVERTE_V2_GRID } from "./scorecard-grid";
import type { ScorecardGeneratedResult } from "./scorecard-result-zod";
import { computeScorecardScore } from "./scorecard-score";
import { classifyQuestion } from "./talk-share-from-transcript";

const PROSPECT =
  "On a une centaine de managers.\nOn a déjà des formateurs internes.";
const SELLER = "Combien de managers sont concernés ?";
const SOURCES = {
  all: `${SELLER}\n${PROSPECT}`,
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
  learned: "Fait.",
  missing: "",
  observable: true,
};

describe("les questions du commercial", () => {
  it("distingue questions ouvertes, fermées et de simple vérification", () => {
    expect(classifyQuestion("Comment ça s'organise chez vous ?")).toBe("open");
    expect(classifyQuestion("Qu'est-ce qui a déçu ?")).toBe("open");
    expect(classifyQuestion("Vous faites de l'inter-entreprise ?")).toBe(
      "closed",
    );
    expect(classifyQuestion("vous voyez ce que je veux dire ?")).toBe("tag");
    expect(classifyQuestion("On est bien d'accord ?")).toBe("tag");
  });

  it("plafonne le questionnement quand les questions ouvertes ne dominent pas", () => {
    // Noz : 20 ouvertes, 22 fermées, 12 de vérification.
    expect(questioningCap({ open: 20, closed: 22, tag: 12 }).max).toBe(2);
    expect(questioningCap({ open: 12, closed: 10, tag: 3 }).max).toBe(3);
    expect(questioningCap({ open: 20, closed: 8, tag: 2 }).max).toBe(4);
  });

  it("plafonne la personnalisation après un long argumentaire en début de rendez-vous", () => {
    const caps = conversationCaps({
      questions: { open: 20, closed: 5, tag: 1 },
      earlyLongestRunWords: 576,
    });
    expect(caps.E3).toEqual({
      max: 2,
      reason: expect.stringContaining("576 mots"),
    });
  });
});

describe("les règles plus pointues de la grille", () => {
  it("refuse le niveau 4 sans chiffre dit par le prospect sur un critère qui l'exige", () => {
    const sansChiffre = levelScorecardObservations(
      releve([
        {
          key: "A1",
          ...creuseExploitable,
          evidence: [
            { who: "commercial", quote: SELLER },
            { who: "prospect", quote: "On a déjà des formateurs internes." },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(sansChiffre.criteria[0]).toMatchObject({
      level: 3,
      capped: "aucun chiffre dit par le prospect",
    });

    const avecChiffre = levelScorecardObservations(
      releve([
        {
          key: "A1",
          ...creuseExploitable,
          evidence: [
            { who: "commercial", quote: SELLER },
            { who: "prospect", quote: "On a une centaine de managers." },
          ],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(avecChiffre.criteria[0].level).toBe(4);
  });

  it("applique un plafond mesuré et en garde la raison", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "E2",
          ...creuseExploitable,
          evidence: [{ who: "commercial", quote: SELLER }],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
      {},
      { E2: { max: 2, reason: "20 questions ouvertes sur 54" } },
    );
    expect(out.criteria[0]).toMatchObject({
      level: 2,
      capped: "20 questions ouvertes sur 54",
    });
  });

  it("sort du calcul un cadrage non observable, sans coûter de points", () => {
    const out = levelScorecardObservations(
      releve([
        {
          key: "E4",
          ...creuseExploitable,
          observable: false,
          evidence: [],
        },
        // Un critère qui ne le permet pas reste noté, même déclaré non observable.
        {
          key: "E2",
          explored: "non",
          obtained: "rien",
          learned: "",
          missing: "",
          observable: false,
          evidence: [],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
    );
    expect(out.criteria.find((c) => c.key === "E4")).toMatchObject({
      unobservable: true,
    });
    expect(
      out.criteria.find((c) => c.key === "E2")?.unobservable,
    ).toBeUndefined();

    const e = (
      levels: { key: string; level: number; unobservable?: boolean }[],
    ) =>
      computeScorecardScore(DECOUVERTE_V2_GRID, levels).blocks.find(
        (b) => b.key === "E",
      )!.score;
    // Trois critères à 4 et le cadrage hors calcul : le bloc vaut son maximum.
    expect(
      e([
        { key: "E1", level: 4 },
        { key: "E2", level: 4 },
        { key: "E3", level: 4 },
        { key: "E4", level: 0, unobservable: true },
      ]),
    ).toBe(16);
    // Le même cadrage compté à 0 aurait coûté 4 points.
    expect(
      e([
        { key: "E1", level: 4 },
        { key: "E2", level: 4 },
        { key: "E3", level: 4 },
        { key: "E4", level: 0 },
      ]),
    ).toBe(12);
  });
});

describe("le questionnement mesuré par le produit", () => {
  it("fixe le niveau sur le compte des questions, quoi que dise le relevé", () => {
    // Noz : 20 ouvertes sur 54.
    const m = questioningMeasure({ open: 20, closed: 22, tag: 12 });
    expect(m.level).toBe(2);
    expect(m.learned).toContain("54 questions");
    expect(m.missing).toContain("40 %");
    const out = levelScorecardObservations(
      releve([
        {
          key: "E2",
          explored: "non",
          obtained: "rien",
          learned: "Sujet non abordé.",
          missing: "",
          observable: true,
          evidence: [],
        },
      ]),
      DECOUVERTE_V2_GRID,
      SOURCES,
      { E2: m },
    );
    expect(out.criteria[0]).toMatchObject({ key: "E2", level: 2 });
    expect(out.criteria[0].learned).toContain("54 questions");
  });

  it("donne 4 à un questionnement ouvert et nourri, 0 sans question", () => {
    expect(questioningMeasure({ open: 20, closed: 8, tag: 2 }).level).toBe(4);
    expect(questioningMeasure({ open: 0, closed: 0, tag: 0 }).level).toBe(0);
  });
});
