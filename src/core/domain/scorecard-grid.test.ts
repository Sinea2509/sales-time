import {
  DECOUVERTE_GRID,
  DEFAULT_SCORECARD_GRID,
  SCORECARD_GRIDS,
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
  scorecardCriteria,
  scorecardGridById,
  scorecardGridProblems,
  type ScorecardBlock,
  type ScorecardGrid,
} from "./scorecard-grid";

const TIRET_CADRATIN = String.fromCodePoint(0x2014);

/** La grille de découverte, un bloc remplacé, pour éprouver les contrôles. */
function grilleAvecBlocs(blocks: readonly ScorecardBlock[]): ScorecardGrid {
  return { ...DECOUVERTE_GRID, blocks };
}

const BLOC_ESSAI: ScorecardBlock = {
  key: "A",
  name: "Contexte",
  weight: 100,
  criteria: [
    { key: "A1", label: "Taille", expected: "Un ordre de grandeur chiffré." },
  ],
};

describe("les grilles livrées", () => {
  it("ne portent aucun défaut détectable", () => {
    for (const grid of SCORECARD_GRIDS) {
      expect(scorecardGridProblems(grid)).toStrictEqual([]);
    }
  });

  it("portent des identifiants distincts", () => {
    const ids = SCORECARD_GRIDS.map((grid) => grid.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("comptent la grille employée par défaut", () => {
    expect(SCORECARD_GRIDS).toContain(DEFAULT_SCORECARD_GRID);
  });

  it("n'emploient aucun tiret cadratin", () => {
    expect(JSON.stringify(SCORECARD_GRIDS)).not.toContain(TIRET_CADRATIN);
  });

  it("nomment et documentent chaque critère", () => {
    for (const grid of SCORECARD_GRIDS) {
      for (const criterion of scorecardCriteria(grid)) {
        expect(criterion.label.trim().length).toBeGreaterThan(0);
        expect(criterion.expected.trim().length).toBeGreaterThan(10);
      }
    }
  });
});

describe("DECOUVERTE_GRID", () => {
  it("porte vingt-cinq critères répartis en cinq blocs", () => {
    expect(DECOUVERTE_GRID.blocks.map((block) => block.key)).toStrictEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
    expect(scorecardCriteria(DECOUVERTE_GRID)).toHaveLength(25);
  });

  it("répartit cent points entre ses blocs", () => {
    expect(DECOUVERTE_GRID.blocks.map((block) => block.weight)).toStrictEqual([
      20, 32, 24, 12, 12,
    ]);
    const cumul = DECOUVERTE_GRID.blocks.reduce(
      (total, block) => total + block.weight,
      0,
    );
    expect(cumul).toBe(SCORECARD_TOTAL);
  });

  it("pèse chaque bloc au niveau maximal de ses critères, sans arrondi", () => {
    for (const block of DECOUVERTE_GRID.blocks) {
      expect(block.weight).toBe(SCORECARD_LEVEL_MAX * block.criteria.length);
    }
  });

  it("préfixe chaque clé de critère par celle de son bloc", () => {
    for (const block of DECOUVERTE_GRID.blocks) {
      block.criteria.forEach((criterion, index) => {
        expect(criterion.key).toBe(`${block.key}${index + 1}`);
      });
    }
  });
});

describe("scorecardCriteria", () => {
  it("met les critères à plat dans l'ordre des blocs", () => {
    const clefs = scorecardCriteria(DECOUVERTE_GRID).map(
      (criterion) => criterion.key,
    );
    expect(clefs.slice(0, 6)).toStrictEqual([
      "A1",
      "A2",
      "A3",
      "A4",
      "A5",
      "B1",
    ]);
    expect(clefs[clefs.length - 1]).toBe("E3");
  });

  it("rend une liste vide pour une grille sans bloc", () => {
    expect(scorecardCriteria(grilleAvecBlocs([]))).toStrictEqual([]);
  });
});

describe("scorecardGridById", () => {
  it("retrouve une grille livrée", () => {
    expect(scorecardGridById("DECOUVERTE")).toBe(DECOUVERTE_GRID);
  });

  it("rend null pour un identifiant inconnu", () => {
    expect(scorecardGridById("CLOSING")).toBeNull();
    expect(scorecardGridById("")).toBeNull();
    expect(scorecardGridById("decouverte")).toBeNull();
  });
});

describe("scorecardGridProblems", () => {
  it("signale une grille sans aucun bloc", () => {
    expect(scorecardGridProblems(grilleAvecBlocs([]))).toContain(
      "grille sans aucun bloc",
    );
  });

  it("signale deux blocs qui portent la même clé", () => {
    const problems = scorecardGridProblems(
      grilleAvecBlocs([
        { ...BLOC_ESSAI, weight: 60 },
        { ...BLOC_ESSAI, weight: 40, criteria: [] },
      ]),
    );
    expect(problems).toContain("bloc en double : A");
  });

  it("signale un poids nul ou non entier", () => {
    expect(
      scorecardGridProblems(
        grilleAvecBlocs([
          { ...BLOC_ESSAI, weight: 0 },
          { ...BLOC_ESSAI, key: "B", weight: 100, criteria: [] },
        ]),
      ),
    ).toContain("poids non entier ou nul pour le bloc A");
    expect(
      scorecardGridProblems(grilleAvecBlocs([{ ...BLOC_ESSAI, weight: 99.5 }])),
    ).toContain("poids non entier ou nul pour le bloc A");
  });

  it("signale un bloc sans critère", () => {
    expect(
      scorecardGridProblems(grilleAvecBlocs([{ ...BLOC_ESSAI, criteria: [] }])),
    ).toContain("bloc sans critère : A");
  });

  it("signale deux critères qui portent la même clé", () => {
    const problems = scorecardGridProblems(
      grilleAvecBlocs([
        {
          ...BLOC_ESSAI,
          criteria: [
            { key: "A1", label: "Taille", expected: "Un ordre de grandeur." },
            {
              key: "A1",
              label: "Effectif",
              expected: "Un nombre de salariés.",
            },
          ],
        },
      ]),
    );
    expect(problems).toContain("critère en double : A1");
  });

  it("signale un critère rangé hors de son bloc", () => {
    const problems = scorecardGridProblems(
      grilleAvecBlocs([
        {
          ...BLOC_ESSAI,
          criteria: [
            { key: "B1", label: "Déclencheur", expected: "Ce qui déclenche." },
          ],
        },
      ]),
    );
    expect(problems).toContain("critère B1 hors de son bloc A");
  });

  it("exige le préfixe et non la simple présence de la clé du bloc", () => {
    // « BA1 » porte bien un A, et rangé sous A il resterait pourtant un
    // critère du bloc B mal classé. La clé doit commencer par celle du bloc.
    const problems = scorecardGridProblems(
      grilleAvecBlocs([
        {
          ...BLOC_ESSAI,
          criteria: [
            { key: "BA1", label: "Déclencheur", expected: "Ce qui déclenche." },
          ],
        },
      ]),
    );
    expect(problems).toContain("critère BA1 hors de son bloc A");
  });

  it("signale un critère sans intitulé ou sans attendu", () => {
    expect(
      scorecardGridProblems(
        grilleAvecBlocs([
          {
            ...BLOC_ESSAI,
            criteria: [{ key: "A1", label: "  ", expected: "Un attendu." }],
          },
        ]),
      ),
    ).toContain("critère incomplet : A1");
    expect(
      scorecardGridProblems(
        grilleAvecBlocs([
          {
            ...BLOC_ESSAI,
            criteria: [{ key: "A1", label: "Taille", expected: "" }],
          },
        ]),
      ),
    ).toContain("critère incomplet : A1");
  });

  it("signale des poids qui ne font pas cent", () => {
    expect(
      scorecardGridProblems(grilleAvecBlocs([{ ...BLOC_ESSAI, weight: 90 }])),
    ).toContain(`poids cumulés à 90 au lieu de ${SCORECARD_TOTAL}`);
    expect(
      scorecardGridProblems(grilleAvecBlocs([{ ...BLOC_ESSAI, weight: 110 }])),
    ).toContain(`poids cumulés à 110 au lieu de ${SCORECARD_TOTAL}`);
  });

  it("ne signale rien sur une grille minimale bien formée", () => {
    expect(scorecardGridProblems(grilleAvecBlocs([BLOC_ESSAI]))).toStrictEqual(
      [],
    );
  });
});
