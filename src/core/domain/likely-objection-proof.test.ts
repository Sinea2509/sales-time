import { describe, expect, it } from "@jest/globals";
import { withProvableAnswers } from "./likely-objection-proof";

const SOLIDE =
  "Restons sur votre budget et sur ce que le statu quo vous coûte.";

const reponse = (answer: string) =>
  withProvableAnswers([{ objection: "C'est trop cher", answer }])[0]?.answer;

describe("withProvableAnswers", () => {
  it("retire la phrase qui garde un crochet à compléter", () => {
    expect(
      reponse(
        `${SOLIDE} De plus, des entreprises comme [client] ont constaté un gain.`,
      ),
    ).toBe(SOLIDE);
  });

  it.each([
    "Nos clients ont constaté un retour rapide.",
    "Nos précédents clients le confirment.",
    "Nous avons des références dans le secteur.",
    "D'autres entreprises ont fait ce choix.",
    "Plusieurs clients nous ont dit la même chose.",
    "De nombreuses entreprises du secteur nous suivent.",
  ])("retire une preuve anonyme : « %s »", (phrase) => {
    expect(reponse(`${SOLIDE} ${phrase}`)).toBe(SOLIDE);
  });

  it("garde une référence nommée et le reste de la réponse", () => {
    const phrase =
      "Vous parliez de dix-huit mille euros. Chez Menuiseries Vermont, ce format a tenu ce budget.";
    expect(reponse(phrase)).toBe(phrase);
  });

  it("garde une phrase qui parle du prospect et de ses propres clients", () => {
    const phrase = "Vos clients vous demandent déjà ce suivi.";
    expect(reponse(phrase)).toBe(phrase);
  });

  it("garde une réponse courte quand rien ne lui a été retiré", () => {
    expect(reponse("Chiffrons le statu quo.")).toBe("Chiffrons le statu quo.");
  });

  it("retire l'objection dont il ne reste qu'une politesse", () => {
    expect(
      reponse("C'est tout à fait compréhensible. Nos clients sont ravis."),
    ).toBeUndefined();
  });

  it("retire l'objection dont il ne reste aucune réponse", () => {
    expect(
      withProvableAnswers([
        { objection: "A", answer: "Nos clients sont ravis." },
        { objection: "B", answer: SOLIDE },
      ]),
    ).toEqual([{ objection: "B", answer: SOLIDE }]);
  });
});
