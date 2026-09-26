import { sellerTopSkills } from "./seller-top-skills";

describe("sellerTopSkills", () => {
  it("rend les deux meilleures compétences, nom court et note", () => {
    expect(
      sellerTopSkills({
        assertivite: 64,
        ecouteActive: 78,
        capitalSympathie: 71,
        argumentation: 58,
        objections: 52,
        nextSteps: 66,
      }),
    ).toEqual([
      { key: "ecouteActive", label: "Écoute", score: 78 },
      { key: "capitalSympathie", label: "Lien", score: 71 },
    ]);
  });

  it("ne rend rien sans notes", () => {
    expect(sellerTopSkills(null)).toEqual([]);
  });
});
