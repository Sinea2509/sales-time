import { libelleTranche, scoreBands } from "./score-bands";
import {
  DECOUVERTE_GRID,
  SCORECARD_GRIDS,
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
  scorecardCriteria,
} from "./scorecard-grid";
import { scorecardGridInstruction } from "./scorecard-prompt";
import { RANKING_TIERS } from "./team-ranking";

const TIRET_CADRATIN = String.fromCodePoint(0x2014);

const CONSIGNE = scorecardGridInstruction(DECOUVERTE_GRID);

describe("scorecardGridInstruction", () => {
  it("nomme la grille et ce qu'elle attend du rendez-vous", () => {
    expect(CONSIGNE).toContain(DECOUVERTE_GRID.name);
    expect(CONSIGNE).toContain(DECOUVERTE_GRID.intent);
  });

  it("écrit chaque bloc avec son nom et son poids", () => {
    for (const block of DECOUVERTE_GRID.blocks) {
      expect(CONSIGNE).toContain(
        `### ${block.key}. ${block.name} (${block.weight} points)`,
      );
    }
  });

  it("écrit chaque critère avec son intitulé et son attendu", () => {
    for (const criterion of scorecardCriteria(DECOUVERTE_GRID)) {
      expect(CONSIGNE).toContain(
        `- **${criterion.key}** ${criterion.label}. Niveau ${SCORECARD_LEVEL_MAX} : ${criterion.expected}`,
      );
    }
  });

  it("ne cite aucune clé que la grille ne porte pas", () => {
    const clefs = [...CONSIGNE.matchAll(/^- \*\*([^*]+)\*\*/gm)].map(
      (found) => found[1],
    );
    expect(clefs).toStrictEqual(
      scorecardCriteria(DECOUVERTE_GRID).map((criterion) => criterion.key),
    );
  });

  it("rend les paliers du produit, ramenés sur le score", () => {
    for (const band of scoreBands({
      max: SCORECARD_TOTAL,
      pointsParUnite: 1,
    })) {
      expect(CONSIGNE).toContain(`- ${libelleTranche(band)}: ${band.tier.nom}`);
    }
    for (const tier of RANKING_TIERS) expect(CONSIGNE).toContain(tier.nom);
  });

  it("interdit de rendre un total ou un nom de palier", () => {
    expect(CONSIGNE).toContain(
      "Return no total, no block subtotal and no level name",
    );
  });

  it("exige une citation du transcript et tranche vers le bas sans elle", () => {
    expect(CONSIGNE).toContain("No quote means level 0");
    expect(CONSIGNE).toContain(
      "When you hesitate between two levels, take the lower one",
    );
    expect(CONSIGNE).toContain("Never rewrite a quote and never compose one");
  });

  it("dit que le commercial est noté, et non ce qu'il vend", () => {
    expect(CONSIGNE).toContain(
      "You rate his work, not the quality of what he sells and not the prospect",
    );
  });

  it("annonce que la liste des critères est complète", () => {
    expect(CONSIGNE).toContain("use these keys, all of them, and no others");
  });

  it("dit qu'un critère laissé de côté vaut zéro", () => {
    expect(CONSIGNE).toContain("A criterion you leave out counts as 0");
  });

  it("n'emploie aucun tiret cadratin", () => {
    for (const grid of SCORECARD_GRIDS) {
      expect(scorecardGridInstruction(grid)).not.toContain(TIRET_CADRATIN);
    }
  });

  it("suit la grille qu'on lui donne, sans rien écrire en dur", () => {
    const consigne = scorecardGridInstruction({
      ...DECOUVERTE_GRID,
      name: "Grille de contrôle",
      intent: "Une intention de contrôle.",
      blocks: [
        {
          key: "Z",
          name: "Bloc unique",
          weight: 100,
          criteria: [
            {
              key: "Z1",
              label: "Un seul critère",
              expected: "Un seul attendu.",
            },
          ],
        },
      ],
    });
    expect(consigne).toContain("### Z. Bloc unique (100 points)");
    expect(consigne).toContain(
      `- **Z1** Un seul critère. Niveau ${SCORECARD_LEVEL_MAX} : Un seul attendu.`,
    );
    expect(consigne).not.toContain("### A.");
    expect(consigne).not.toContain("**A1**");
  });
});
