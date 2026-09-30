import { describe, expect, it } from "@jest/globals";
import {
  allowedEvidenceEdits,
  evidenceWords,
  isExcerptInSource,
} from "./transcript-evidence";

const TRANSCRIPT = `Claire : Nous avions mis 15 000 euros de côté pour la formation cette année, mais je peux aller un peu au-dessus si le résultat est là. Nous regardons aussi la proposition d'un cabinet de Lyon, moins chère.
Julien : Qui d'autre que vous participera à la décision ?
Claire : Marc Vermont, le directeur général. C'est lui qui signe.
Claire : Oui, il est disponible le 7 octobre en fin de matinée.
Claire : Nous avons regardé les devis signés du premier semestre avec notre contrôleur de gestion. Sur 140 affaires, 96 ont une remise supérieure à 5 %.`;

const source = evidenceWords(TRANSCRIPT);

describe("evidenceWords", () => {
  it("ignore la casse, les accents et la ponctuation", () => {
    expect(evidenceWords("« C'est lui qui SIGNE. »")).toEqual([
      "c",
      "est",
      "lui",
      "qui",
      "signe",
    ]);
    expect(evidenceWords("Décidé, déjà !")).toEqual(["decide", "deja"]);
  });
});

describe("isExcerptInSource", () => {
  it("retrouve une citation exacte, quelle que soit sa ponctuation", () => {
    expect(isExcerptInSource("« C'est lui qui signe. »", source)).toBe(true);
    expect(isExcerptInSource("c est lui qui signe", source)).toBe(true);
  });

  it("tolère un mot changé dans une citation de quatre mots ou plus", () => {
    expect(isExcerptInSource("Nous avions mit 15 000 euros", source)).toBe(
      true,
    );
    expect(
      isExcerptInSource("une proposition d'un cabinet de Lyon", source),
    ).toBe(true);
  });

  it("tolère un mot manquant ou ajouté dans une citation assez longue", () => {
    expect(
      isExcerptInSource(
        "Nous avons regardé les devis du premier semestre avec notre contrôleur de gestion",
        source,
      ),
    ).toBe(true);
  });

  it("exige une citation exacte quand elle tient en trois mots", () => {
    expect(isExcerptInSource("le 7 octobre", source)).toBe(true);
    expect(isExcerptInSource("le 8 octobre", source)).toBe(false);
  });

  it("écarte une définition de critère présentée comme une citation", () => {
    expect(
      isExcerptInSource(
        "Ce qui fait que le prospect s'en occupe maintenant",
        source,
      ),
    ).toBe(false);
    expect(
      isExcerptInSource(
        "ce qui pourrait faire échouer le projet en interne",
        source,
      ),
    ).toBe(false);
  });

  it("vérifie morceau par morceau une citation coupée par des points de suspension", () => {
    expect(
      isExcerptInSource(
        "Nous avons regardé les devis … Sur 140 affaires, 96 ont une remise",
        source,
      ),
    ).toBe(true);
    expect(
      isExcerptInSource(
        "Nous avons regardé les devis... une phrase que personne n'a dite",
        source,
      ),
    ).toBe(false);
  });

  it("n'accepte pas une citation vide", () => {
    expect(isExcerptInSource("", source)).toBe(false);
    expect(isExcerptInSource(" « » ", source)).toBe(false);
  });
});

describe("allowedEvidenceEdits", () => {
  it("n'accorde aucun écart à trois mots, un à quatre, un par cinq mots ensuite", () => {
    expect(allowedEvidenceEdits(3)).toBe(0);
    expect(allowedEvidenceEdits(4)).toBe(1);
    expect(allowedEvidenceEdits(9)).toBe(1);
    expect(allowedEvidenceEdits(10)).toBe(2);
  });
});

describe("les tolérances ajoutées après la relecture", () => {
  it("recolle les tranches de milliers, des deux côtés", () => {
    expect(evidenceWords("15 000 euros")).toEqual(["15000", "euros"]);
    expect(evidenceWords("1 500 000 €")).toEqual(["1500000"]);
    expect(evidenceWords("en 2025 200 affaires")).toEqual([
      "en",
      "2025",
      "200",
      "affaires",
    ]);
    expect(
      isExcerptInSource("Nous avions mis 15000 euros de côté", source),
    ).toBe(true);
  });

  it("retrouve une citation sur deux phrases que le transcript sépare d'un nom et d'une heure", () => {
    const teams = evidenceWords(
      "Claire Dupont 00:12:34\nLe chiffre d'affaires tient, mais la marge baisse.\nClaire Dupont 00:12:41\nMes commerciaux accordent des remises trop vite.",
    );
    expect(
      isExcerptInSource(
        "Le chiffre d'affaires tient, mais la marge baisse. Mes commerciaux accordent des remises trop vite.",
        teams,
      ),
    ).toBe(true);
  });
});
