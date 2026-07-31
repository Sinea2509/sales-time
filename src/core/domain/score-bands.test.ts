import { libelleTranche, scoreBands } from "./score-bands";
import {
  COACHING_SCORE_MAX,
  POINTS_PAR_COACHING_SCORE,
  coachingScoreBands,
} from "./coaching-score-scale";
import { RANKING_TIERS, tierFromSalesScore } from "./team-ranking";

describe("scoreBands", () => {
  it("découpe l'échelle centésimale sur les bornes des paliers", () => {
    const bandes = scoreBands({ max: 100, pointsParUnite: 1 });
    expect(
      bandes.map((band) => [band.tier.id, band.min, band.max]),
    ).toStrictEqual([
      ["demarrage", 0, 39],
      ["progression", 40, 59],
      ["maitrise", 60, 79],
      ["excellence", 80, 100],
    ]);
  });

  it("rend exactement les tranches employées par le coachingScore", () => {
    expect(
      scoreBands({
        max: COACHING_SCORE_MAX,
        pointsParUnite: POINTS_PAR_COACHING_SCORE,
      }),
    ).toStrictEqual(coachingScoreBands());
  });

  it("pave l'échelle sans trou ni chevauchement", () => {
    for (const max of [10, 20, 100]) {
      const bandes = scoreBands({ max, pointsParUnite: 100 / max });
      expect(bandes.length).toBeGreaterThan(0);
      expect(bandes[0]?.min).toBe(0);
      expect(bandes[bandes.length - 1]?.max).toBe(max);
      for (const band of bandes) expect(band.min).toBeLessThanOrEqual(band.max);
      for (let i = 1; i < bandes.length; i += 1) {
        expect(bandes[i]?.min).toBe((bandes[i - 1]?.max ?? 0) + 1);
      }
    }
  });

  it("range chaque entier dans le palier que le produit lui donne", () => {
    const bandes = scoreBands({ max: 100, pointsParUnite: 1 });
    for (let note = 0; note <= 100; note += 1) {
      const band = bandes.find((b) => note >= b.min && note <= b.max);
      expect(band?.tier.id).toBe(tierFromSalesScore(note)?.id);
    }
  });

  it("ne nomme jamais deux fois le même palier", () => {
    const ids = scoreBands({ max: 100, pointsParUnite: 1 }).map(
      (band) => band.tier.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("omet un palier trop étroit pour contenir un entier de l'échelle", () => {
    // Une échelle de 0 à 2 ne peut exprimer que 0, 50 et 100 points : les
    // paliers Progression (40 à 59) et Maîtrise (60 à 79) n'ont chacun aucun
    // entier à eux, et un seul des deux peut donc apparaître.
    const bandes = scoreBands({ max: 2, pointsParUnite: 50 });
    expect(
      bandes.map((band) => [band.tier.id, band.min, band.max]),
    ).toStrictEqual([
      ["demarrage", 0, 0],
      ["progression", 1, 1],
      ["excellence", 2, 2],
    ]);
    expect(bandes.length).toBeLessThan(RANKING_TIERS.length);
  });

  it("referme une tranche sur elle-même quand elle ne porte qu'un entier", () => {
    // Chaque tranche est ici ouverte et refermée sur la même note, sans que la
    // note suivante vienne repousser sa borne haute. Le libellé qui en sort
    // n'écrit donc qu'un nombre, « 1 » et non « 1–1 ».
    expect(
      scoreBands({ max: 2, pointsParUnite: 50 }).map(libelleTranche),
    ).toStrictEqual(["0", "1", "2"]);
  });

  it("rend une liste vide quand l'échelle n'a aucun entier", () => {
    expect(scoreBands({ max: -1, pointsParUnite: 1 })).toStrictEqual([]);
  });

  it("rend une liste vide quand le cran de l'échelle n'est pas un nombre", () => {
    expect(scoreBands({ max: 10, pointsParUnite: Number.NaN })).toStrictEqual(
      [],
    );
  });

  it("rend une liste vide plutôt que de boucler sans fin", () => {
    // Une borne haute infinie ne rend pas une échelle infinie : elle fait
    // tourner la boucle jusqu'à ce que la page se fige. Le test tiendrait la
    // suite entière jusqu'au délai de jest si la garde disparaissait.
    expect(
      scoreBands({ max: Number.POSITIVE_INFINITY, pointsParUnite: 1 }),
    ).toStrictEqual([]);
  });

  it("s'arrête au dernier entier d'une borne haute qui n'en est pas un", () => {
    // La garde porte sur ce qui se boucle, pas sur ce qui s'exprime : une
    // borne à 2,5 se parcourt très bien, et une échelle qui monte jusque-là
    // exprime 0, 1 et 2. Rendre une liste vide perdrait trois tranches
    // exactes au motif que la borne est écrite avec une virgule.
    expect(scoreBands({ max: 2.5, pointsParUnite: 50 })).toStrictEqual(
      scoreBands({ max: 2, pointsParUnite: 50 }),
    );
  });
});

describe("libelleTranche", () => {
  it("écrit les deux bornes séparées par un tiret demi-cadratin", () => {
    expect(libelleTranche({ tier: RANKING_TIERS[0]!, min: 0, max: 39 })).toBe(
      "0–39",
    );
  });

  it("n'écrit qu'un nombre quand la tranche ne porte qu'un entier", () => {
    expect(libelleTranche({ tier: RANKING_TIERS[0]!, min: 7, max: 7 })).toBe(
      "7",
    );
  });
});
