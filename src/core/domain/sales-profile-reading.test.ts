import { salesProfileReading } from "./sales-profile-reading";

const current = {
  assertivite: 64,
  ecouteActive: 78,
  capitalSympathie: 71,
  argumentation: 58,
  objections: 52,
  nextSteps: 66,
};
const previous = {
  assertivite: 58,
  ecouteActive: 74,
  capitalSympathie: 70,
  argumentation: 60,
  objections: 45,
  nextSteps: 57,
};

describe("salesProfileReading", () => {
  it("nomme le point d'appui, la marge, la progression et le recul", () => {
    const r = salesProfileReading(current, previous);

    expect(r.strongest).toEqual({
      key: "ecouteActive",
      label: "Écoute active",
      value: 78,
    });
    expect(r.weakest).toEqual({
      key: "objections",
      label: "Traitement des objections",
      value: 52,
    });
    /* 57 vers 66 : +15,8 %, la plus forte hausse. */
    expect(r.bestProgress).toEqual({
      key: "nextSteps",
      label: "Engagement obtenu",
      deltaPct: 15.8,
    });
    /* 60 vers 58 : -3,3 %, le seul recul. */
    expect(r.worstRegression).toEqual({
      key: "argumentation",
      label: "Argumentation",
      deltaPct: -3.3,
    });
    expect(r.text).toBe(
      "Le critère Écoute active est votre point d'appui, à 78 sur 100. Le critère Traitement des objections est votre marge la plus nette, à 52 sur 100. La plus forte progression de la période porte sur le critère Engagement obtenu, qui gagne 15,8 %. Le critère Argumentation recule de 3,3 %, c'est là qu'il faut regarder.",
    );
    expect(r.evolution[0]?.key).toBe("nextSteps");
    expect(r.evolution[r.evolution.length - 1]?.key).toBe("argumentation");
  });

  it("parle du commercial à la troisième personne pour son manager", () => {
    const r = salesProfileReading(current, previous, "manager");
    expect(r.text).toContain("est son point d'appui");
    expect(r.text).toContain("est sa marge la plus nette");
  });

  it("dit qu'il s'agit d'une première période sans précédent", () => {
    const r = salesProfileReading(current, null);
    expect(r.bestProgress).toBeNull();
    expect(r.worstRegression).toBeNull();
    expect(r.text).toContain("Première période mesurée");
  });
});
