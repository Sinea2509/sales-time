import { describe, expect, it } from "@jest/globals";
import { sellerActionPlan, SELLER_ACTION_PLAN_MAX } from "./seller-action-plan";

describe("sellerActionPlan", () => {
  it("mène par les rituels à lancer, puis les gestes à affiner", () => {
    const plan = sellerActionPlan({
      startBullets: ["Dater la prochaine étape", "Demander qui décide"],
      improveBullets: ["Chiffrer l'enjeu avant le prix"],
    });
    expect(plan).toEqual([
      { kind: "start", text: "Dater la prochaine étape" },
      { kind: "start", text: "Demander qui décide" },
      { kind: "improve", text: "Chiffrer l'enjeu avant le prix" },
    ]);
  });

  it("plafonne le plan et garde les rituels quand tout ne rentre pas", () => {
    const plan = sellerActionPlan({
      startBullets: ["a", "b", "c", "d"],
      improveBullets: ["e", "f"],
    });
    expect(plan).toHaveLength(SELLER_ACTION_PLAN_MAX);
    expect(plan.every((p) => p.kind === "start")).toBe(true);
  });

  it("complète avec les gestes à affiner quand les rituels manquent", () => {
    const plan = sellerActionPlan({
      startBullets: ["a"],
      improveBullets: ["b", "c", "d"],
    });
    expect(plan.map((p) => p.kind)).toEqual(["start", "improve", "improve"]);
    expect(plan.map((p) => p.text)).toEqual(["a", "b", "c"]);
  });

  it("rend un plan vide quand il n'y a aucun geste", () => {
    expect(sellerActionPlan({ startBullets: [], improveBullets: [] })).toEqual(
      [],
    );
  });

  it("respecte une limite explicite, y compris zéro", () => {
    expect(
      sellerActionPlan({ startBullets: ["a", "b"], improveBullets: ["c"] }, 1),
    ).toEqual([{ kind: "start", text: "a" }]);
    expect(
      sellerActionPlan({ startBullets: ["a"], improveBullets: ["b"] }, 0),
    ).toEqual([]);
  });
});
