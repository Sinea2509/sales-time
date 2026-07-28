import {
  salesProfileEvolution,
  salesProfileOverallEvolution,
} from "./sales-profile-evolution";
import type { SalesProfileScores } from "./sales-profile-from-meetings";

const scores = (
  over: Partial<SalesProfileScores> = {},
): SalesProfileScores => ({
  assertivite: 50,
  ecouteActive: 50,
  capitalSympathie: 50,
  argumentation: 50,
  objections: 50,
  nextSteps: 50,
  ...over,
});

describe("salesProfileEvolution", () => {
  it("rend une croissance relative positive par compétence", () => {
    const evo = salesProfileEvolution(
      scores({ ecouteActive: 84 }),
      scores({ ecouteActive: 70 }),
    );
    const ecoute = evo.find((d) => d.key === "ecouteActive")!;
    expect(ecoute.current).toBe(84);
    expect(ecoute.previous).toBe(70);
    // (84 - 70) / 70 = 0,2 => 20 %
    expect(ecoute.deltaPct).toBeCloseTo(20, 5);
  });

  it("rend une décroissance en négatif", () => {
    const evo = salesProfileEvolution(
      scores({ objections: 45 }),
      scores({ objections: 60 }),
    );
    const obj = evo.find((d) => d.key === "objections")!;
    expect(obj.deltaPct).toBeCloseTo(-25, 5);
  });

  it("rend zéro quand la note ne bouge pas", () => {
    const evo = salesProfileEvolution(scores(), scores());
    expect(evo.every((d) => d.deltaPct === 0)).toBe(true);
  });

  it("rend deltaPct null sur toutes les compétences sans période précédente", () => {
    const evo = salesProfileEvolution(scores({ assertivite: 80 }), null);
    expect(evo).toHaveLength(6);
    expect(evo.every((d) => d.deltaPct === null)).toBe(true);
    expect(evo.every((d) => d.previous === null)).toBe(true);
    expect(evo.find((d) => d.key === "assertivite")!.current).toBe(80);
  });

  it("rend deltaPct null quand le précédent vaut zéro, jamais l'infini", () => {
    const evo = salesProfileEvolution(
      scores({ nextSteps: 40 }),
      scores({ nextSteps: 0 }),
    );
    const next = evo.find((d) => d.key === "nextSteps")!;
    expect(next.previous).toBe(0);
    expect(next.deltaPct).toBeNull();
  });

  it("garde l'ordre canonique des six dimensions", () => {
    const evo = salesProfileEvolution(scores(), scores());
    expect(evo.map((d) => d.key)).toEqual([
      "assertivite",
      "ecouteActive",
      "capitalSympathie",
      "argumentation",
      "objections",
      "nextSteps",
    ]);
  });
});

describe("salesProfileOverallEvolution", () => {
  it("moyenne les six compétences en arrondissant", () => {
    // somme 300 => 50 pile
    const overall = salesProfileOverallEvolution(scores(), null);
    expect(overall.currentAverage).toBe(50);
    expect(overall.previousAverage).toBeNull();
    expect(overall.deltaPct).toBeNull();
  });

  it("arrondit la moyenne au plus proche, ni vers le bas ni vers le haut", () => {
    // 60*5 + 35 = 335, / 6 = 55,83 -> 56 (floor donnerait 55)
    const current = scores({
      nextSteps: 35,
      assertivite: 60,
      ecouteActive: 60,
      capitalSympathie: 60,
      argumentation: 60,
      objections: 60,
    });
    expect(salesProfileOverallEvolution(current, null).currentAverage).toBe(56);
  });

  it("calcule la variation relative du profil global", () => {
    // actuel moyenne 60, précédent moyenne 50 => +20 %
    const current = scores({
      assertivite: 60,
      ecouteActive: 60,
      capitalSympathie: 60,
      argumentation: 60,
      objections: 60,
      nextSteps: 60,
    });
    const previous = scores();
    const overall = salesProfileOverallEvolution(current, previous);
    expect(overall.currentAverage).toBe(60);
    expect(overall.previousAverage).toBe(50);
    expect(overall.deltaPct).toBeCloseTo(20, 5);
  });

  it("rend une décroissance globale en négatif", () => {
    const current = scores({ assertivite: 30, ecouteActive: 30 });
    // moyenne actuelle (30+30+50+50+50+50)/6 = 43,33 -> 43
    // moyenne précédente 50 -> (43-50)/50 = -14 %
    const overall = salesProfileOverallEvolution(current, scores());
    expect(overall.currentAverage).toBe(43);
    expect(overall.deltaPct).toBeCloseTo(-14, 5);
  });
});
