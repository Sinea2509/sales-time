import {
  DECOUVERTE_GRID,
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
  scorecardCriteria,
  scorecardGridProblems,
  type ScorecardGrid,
} from "./scorecard-grid";
import {
  computeScorecardScore,
  scorecardLevelsByKey,
  scorecardNormalizedLevel,
  type ScorecardLevel,
} from "./scorecard-score";

/** Les niveaux d'une grille, écrits en clair plutôt qu'en tableau. */
function niveaux(map: Record<string, number>): ScorecardLevel[] {
  return Object.entries(map).map(([key, level]) => ({ key, level }));
}

/** Le même niveau pour tous les critères de la grille. */
function niveauPartout(grid: ScorecardGrid, level: number): ScorecardLevel[] {
  return scorecardCriteria(grid).map((criterion) => ({
    key: criterion.key,
    level,
  }));
}

function scoresParBloc(grid: ScorecardGrid, levels: ScorecardLevel[]) {
  return computeScorecardScore(grid, levels).blocks.map((block) => block.score);
}

/**
 * Une grille dont les poids ne valent pas quatre fois le nombre de critères.
 *
 * La grille de découverte tombe juste à chaque bloc, si bien qu'elle ne dit
 * rien du partage des points d'arrondi. Celle-ci le dit : trois blocs de deux
 * critères, pesant 33, 33 et 34.
 */
const GRILLE_A_DECIMALES: ScorecardGrid = {
  id: "DECOUVERTE",
  name: "Grille de contrôle",
  intent: "Éprouver le partage des points d'arrondi.",
  blocks: [
    {
      key: "A",
      name: "Bloc A",
      weight: 33,
      criteria: [
        { key: "A1", label: "A1", expected: "Attendu." },
        { key: "A2", label: "A2", expected: "Attendu." },
      ],
    },
    {
      key: "B",
      name: "Bloc B",
      weight: 33,
      criteria: [
        { key: "B1", label: "B1", expected: "Attendu." },
        { key: "B2", label: "B2", expected: "Attendu." },
      ],
    },
    {
      key: "C",
      name: "Bloc C",
      weight: 34,
      criteria: [
        { key: "C1", label: "C1", expected: "Attendu." },
        { key: "C2", label: "C2", expected: "Attendu." },
      ],
    },
  ],
};

describe("scorecardNormalizedLevel", () => {
  it("garde les niveaux de l'échelle", () => {
    for (let level = 0; level <= SCORECARD_LEVEL_MAX; level += 1) {
      expect(scorecardNormalizedLevel(level)).toBe(level);
    }
  });

  it("ramène à zéro tout ce qui est sous l'échelle", () => {
    expect(scorecardNormalizedLevel(-1)).toBe(0);
    expect(scorecardNormalizedLevel(-40)).toBe(0);
    expect(scorecardNormalizedLevel(-0.4)).toBe(0);
  });

  it("plafonne au niveau maximal", () => {
    expect(scorecardNormalizedLevel(5)).toBe(SCORECARD_LEVEL_MAX);
    expect(scorecardNormalizedLevel(1000)).toBe(SCORECARD_LEVEL_MAX);
  });

  it("arrondit un niveau décimal", () => {
    expect(scorecardNormalizedLevel(2.4)).toBe(2);
    expect(scorecardNormalizedLevel(2.5)).toBe(3);
    expect(scorecardNormalizedLevel(3.6)).toBe(4);
    expect(scorecardNormalizedLevel(0.4)).toBe(0);
  });

  it("rend zéro pour un nombre qui n'en est pas un", () => {
    expect(scorecardNormalizedLevel(Number.NaN)).toBe(0);
    expect(scorecardNormalizedLevel(Number.POSITIVE_INFINITY)).toBe(0);
    expect(scorecardNormalizedLevel(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("scorecardLevelsByKey", () => {
  it("range les niveaux par clé", () => {
    const parCle = scorecardLevelsByKey(niveaux({ A1: 3, B2: 1 }));
    expect(parCle.get("A1")).toBe(3);
    expect(parCle.get("B2")).toBe(1);
    expect(parCle.size).toBe(2);
  });

  it("met les clés en majuscules et retire les espaces", () => {
    const parCle = scorecardLevelsByKey([
      { key: " a1 ", level: 2 },
      { key: "b2", level: 4 },
    ]);
    expect(parCle.get("A1")).toBe(2);
    expect(parCle.get("B2")).toBe(4);
  });

  it("garde le plus bas des deux niveaux d'une clé en double", () => {
    expect(
      scorecardLevelsByKey([
        { key: "B3", level: 4 },
        { key: "B3", level: 1 },
      ]).get("B3"),
    ).toBe(1);
    expect(
      scorecardLevelsByKey([
        { key: "B3", level: 1 },
        { key: "b3", level: 4 },
      ]).get("B3"),
    ).toBe(1);
  });

  it("ignore une clé vide", () => {
    expect(scorecardLevelsByKey([{ key: "   ", level: 4 }]).size).toBe(0);
  });

  it("normalise chaque niveau au passage", () => {
    const parCle = scorecardLevelsByKey([
      { key: "A1", level: 9 },
      { key: "A2", level: -3 },
      { key: "A3", level: Number.NaN },
    ]);
    expect(parCle.get("A1")).toBe(SCORECARD_LEVEL_MAX);
    expect(parCle.get("A2")).toBe(0);
    expect(parCle.get("A3")).toBe(0);
  });
});

describe("computeScorecardScore sur la grille de découverte", () => {
  it("rend zéro partout quand rien n'est noté", () => {
    const score = computeScorecardScore(DECOUVERTE_GRID, []);
    expect(score.overallScore).toBe(0);
    expect(score.blocks.map((block) => block.score)).toStrictEqual([
      0, 0, 0, 0, 0,
    ]);
  });

  it("rend cent quand tous les critères sont au maximum", () => {
    const score = computeScorecardScore(
      DECOUVERTE_GRID,
      niveauPartout(DECOUVERTE_GRID, SCORECARD_LEVEL_MAX),
    );
    expect(score.overallScore).toBe(SCORECARD_TOTAL);
    for (const block of score.blocks) expect(block.score).toBe(block.max);
  });

  it("additionne les niveaux bloc par bloc, sans règle de trois", () => {
    const score = computeScorecardScore(
      DECOUVERTE_GRID,
      niveaux({
        A1: 4,
        A2: 3,
        A3: 0,
        A4: 2,
        A5: 1,
        B1: 4,
        B2: 4,
        B3: 2,
        B4: 0,
        B5: 0,
        B6: 1,
        B7: 3,
        B8: 2,
        C1: 4,
        C2: 2,
        C3: 0,
        C4: 0,
        C5: 1,
        C6: 0,
        D1: 4,
        D2: 0,
        D3: 2,
        E1: 3,
        E2: 2,
        E3: 4,
      }),
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([
      10, 16, 7, 6, 9,
    ]);
    expect(score.overallScore).toBe(48);
  });

  it("compte zéro pour un critère que le modèle a oublié", () => {
    expect(
      scoresParBloc(DECOUVERTE_GRID, niveaux({ A1: 4, A2: 4 })),
    ).toStrictEqual([8, 0, 0, 0, 0]);
  });

  it("ignore une clé qui n'est dans aucun bloc", () => {
    expect(
      scoresParBloc(DECOUVERTE_GRID, niveaux({ A1: 4, Z9: 4, "": 4 })),
    ).toStrictEqual([4, 0, 0, 0, 0]);
  });

  it("tranche vers le bas quand une clé revient deux fois", () => {
    expect(
      scoresParBloc(DECOUVERTE_GRID, [
        { key: "A1", level: 4 },
        { key: "A1", level: 2 },
      ]),
    ).toStrictEqual([2, 0, 0, 0, 0]);
  });

  it("reconnaît une clé écrite en minuscules", () => {
    expect(
      scoresParBloc(DECOUVERTE_GRID, [{ key: "b3", level: 3 }]),
    ).toStrictEqual([0, 3, 0, 0, 0]);
  });

  it("ramène dans l'échelle un niveau qui en sort", () => {
    expect(
      scoresParBloc(DECOUVERTE_GRID, [
        { key: "A1", level: 12 },
        { key: "A2", level: -5 },
      ]),
    ).toStrictEqual([4, 0, 0, 0, 0]);
  });

  it("retrouve un critère dont la grille écrit la clé en minuscules", () => {
    // Rien n'oblige une grille à écrire ses clés en majuscules, et une grille
    // composée par une organisation pourra très bien porter « a1 » : les
    // contrôles de `scorecardGridProblems` n'y voient aucun défaut. La
    // tolérance accordée au modèle vaut donc aussi pour la donnée.
    const grille: ScorecardGrid = {
      ...DECOUVERTE_GRID,
      blocks: [
        {
          key: "a",
          name: "Bloc a",
          weight: SCORECARD_TOTAL,
          criteria: [{ key: "a1", label: "Taille", expected: "Un attendu." }],
        },
      ],
    };
    expect(scorecardGridProblems(grille)).toStrictEqual([]);
    expect(
      computeScorecardScore(grille, niveaux({ A1: SCORECARD_LEVEL_MAX }))
        .overallScore,
    ).toBe(SCORECARD_TOTAL);
  });

  it("reprend la clé, le nom et le poids de chaque bloc", () => {
    const score = computeScorecardScore(DECOUVERTE_GRID, []);
    expect(
      score.blocks.map((block) => [block.key, block.name, block.max]),
    ).toStrictEqual(
      DECOUVERTE_GRID.blocks.map((block) => [
        block.key,
        block.name,
        block.weight,
      ]),
    );
  });
});

describe("computeScorecardScore quand les poids produisent des décimales", () => {
  it("rend le point d'arrondi au bloc dont la part est la plus forte", () => {
    // 8,25 · 8,25 · 8,5 pour un total de 25 : le point va au bloc C.
    const score = computeScorecardScore(
      GRILLE_A_DECIMALES,
      niveauPartout(GRILLE_A_DECIMALES, 1),
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([8, 8, 9]);
    expect(score.overallScore).toBe(25);
  });

  it("rend un point à chaque bloc quand il y en a autant que de parts", () => {
    // 24,75 · 24,75 · 25,5 pour un total de 75 : deux points à rendre pour
    // deux plus fortes parts, A et B les prennent tous les deux. Le cas ne dit
    // rien de l'ordre, puisque personne n'est laissé de côté.
    const score = computeScorecardScore(
      GRILLE_A_DECIMALES,
      niveauPartout(GRILLE_A_DECIMALES, 3),
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([
      25, 25, 25,
    ]);
    expect(score.overallScore).toBe(75);
  });

  it("tranche une égalité de parts en faveur du premier bloc", () => {
    // 12,375 · 12,375 · 0 pour un total de 24,75, arrondi à 25 : un seul point
    // à rendre pour deux parts égales, et c'est A qui le prend. Le cas où tout
    // le monde est servi ne dirait rien de ce choix ; celui-ci le fixe.
    const score = computeScorecardScore(
      GRILLE_A_DECIMALES,
      niveaux({ A1: 3, B1: 3 }),
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([13, 12, 0]);
    expect(score.overallScore).toBe(25);
  });

  it("arrondit le total au plus près plutôt que de le tronquer", () => {
    // 24,75 · 0 · 0 : tronquer rendrait 24 et volerait au commercial le point
    // qu'il a gagné aux trois quarts. Le total est arrondi au plus près, et
    // c'est le bloc qui porte la part décimale qui reçoit le point.
    const score = computeScorecardScore(
      GRILLE_A_DECIMALES,
      niveaux({ A1: 3, A2: 3 }),
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([25, 0, 0]);
    expect(score.overallScore).toBe(25);
  });

  it("arrondit le total vers le bas sous la moitié d'un point", () => {
    // 12,375 · 0 · 0 : arrondir au plus près n'est pas arrondir vers le haut.
    // Un tiers de point gagné ne fait pas un point, sans quoi un commercial
    // qui n'a rien dit de plus verrait sa note monter. Le cas précédent fixe
    // le sens au-dessus de la moitié, celui-ci le fixe en dessous.
    const score = computeScorecardScore(GRILLE_A_DECIMALES, niveaux({ A1: 3 }));
    expect(score.blocks.map((block) => block.score)).toStrictEqual([12, 0, 0]);
    expect(score.overallScore).toBe(12);
  });

  it("garde des scores entiers", () => {
    for (let level = 0; level <= SCORECARD_LEVEL_MAX; level += 1) {
      const score = computeScorecardScore(
        GRILLE_A_DECIMALES,
        niveauPartout(GRILLE_A_DECIMALES, level),
      );
      for (const block of score.blocks) {
        expect(Number.isInteger(block.score)).toBe(true);
      }
    }
  });
});

describe("les propriétés que la fiche affiche", () => {
  /** Suite déterministe, pour que l'échec se rejoue tel quel. */
  function niveauxTires(grid: ScorecardGrid, graine: number): ScorecardLevel[] {
    let curseur = graine;
    return scorecardCriteria(grid).map((criterion) => {
      curseur = (curseur * 1103515245 + 12345) % 2147483648;
      return {
        key: criterion.key,
        level: curseur % (SCORECARD_LEVEL_MAX + 1),
      };
    });
  }

  it("la somme des blocs est exactement le score global", () => {
    for (const grid of [DECOUVERTE_GRID, GRILLE_A_DECIMALES]) {
      for (let graine = 1; graine <= 200; graine += 1) {
        const score = computeScorecardScore(grid, niveauxTires(grid, graine));
        const cumul = score.blocks.reduce(
          (total, block) => total + block.score,
          0,
        );
        expect(cumul).toBe(score.overallScore);
      }
    }
  });

  it("aucun bloc ne dépasse son maximum, aucun ne passe sous zéro", () => {
    for (const grid of [DECOUVERTE_GRID, GRILLE_A_DECIMALES]) {
      for (let graine = 1; graine <= 200; graine += 1) {
        const score = computeScorecardScore(grid, niveauxTires(grid, graine));
        for (const block of score.blocks) {
          expect(block.score).toBeGreaterThanOrEqual(0);
          expect(block.score).toBeLessThanOrEqual(block.max);
        }
        expect(score.overallScore).toBeLessThanOrEqual(SCORECARD_TOTAL);
      }
    }
  });

  it("un niveau qui monte ne fait jamais baisser le score global", () => {
    const criteria = scorecardCriteria(DECOUVERTE_GRID);
    let precedent = -1;
    for (let level = 0; level <= SCORECARD_LEVEL_MAX; level += 1) {
      const score = computeScorecardScore(
        DECOUVERTE_GRID,
        criteria.map((criterion) => ({ key: criterion.key, level })),
      );
      expect(score.overallScore).toBeGreaterThan(precedent);
      precedent = score.overallScore;
    }
  });

  it("ne divise pas par zéro sur un bloc sans critère", () => {
    const score = computeScorecardScore(
      {
        ...DECOUVERTE_GRID,
        blocks: [{ ...DECOUVERTE_GRID.blocks[0]!, criteria: [] }],
      },
      [],
    );
    expect(score.blocks.map((block) => block.score)).toStrictEqual([0]);
    expect(score.overallScore).toBe(0);
  });

  it("rend un score nul pour une grille sans bloc", () => {
    const score = computeScorecardScore({ ...DECOUVERTE_GRID, blocks: [] }, []);
    expect(score.blocks).toStrictEqual([]);
    expect(score.overallScore).toBe(0);
  });
});
