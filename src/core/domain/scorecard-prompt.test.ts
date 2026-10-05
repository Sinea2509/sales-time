import {
  DECOUVERTE_V2_GRID,
  SCORECARD_GRIDS,
  SCORECARD_LEVEL_MAX,
  scorecardCriteria,
  type ScorecardGrid,
} from "./scorecard-grid";
import { scorecardLevelFromCoverage } from "./scorecard-coverage";
import { scorecardGridInstruction } from "./scorecard-prompt";

const TIRET_CADRATIN = String.fromCodePoint(0x2014);

const CONSIGNE = scorecardGridInstruction(DECOUVERTE_V2_GRID);

describe("scorecardGridInstruction", () => {
  it("nomme la grille, ce qu'elle attend et ce qu'elle n'attend pas", () => {
    expect(CONSIGNE).toContain(DECOUVERTE_V2_GRID.name);
    expect(CONSIGNE).toContain(DECOUVERTE_V2_GRID.intent);
    expect(CONSIGNE).toContain(DECOUVERTE_V2_GRID.notExpected!);
  });

  it("écrit chaque bloc avec son nom et son poids", () => {
    for (const block of DECOUVERTE_V2_GRID.blocks) {
      expect(CONSIGNE).toContain(
        `### ${block.key}. ${block.name} (${block.weight} points)`,
      );
    }
  });

  it("écrit chaque critère avec ce qui compte, son niveau 4 et ses exemples", () => {
    for (const criterion of scorecardCriteria(DECOUVERTE_V2_GRID)) {
      expect(CONSIGNE).toContain(`- **${criterion.key}** ${criterion.label}.`);
      expect(CONSIGNE).toContain(
        `Niveau ${SCORECARD_LEVEL_MAX} : ${criterion.expected}`,
      );
      if (criterion.lookFor) {
        expect(CONSIGNE).toContain(`Ce qui compte : ${criterion.lookFor}`);
      }
      for (const example of criterion.examples ?? []) {
        expect(CONSIGNE).toContain(`« ${example} »`);
      }
    }
  });

  it("ne cite aucune clé que la grille ne porte pas", () => {
    const clefs = [...CONSIGNE.matchAll(/^- \*\*([A-Z]\d+)\*\*/gm)].map(
      (found) => found[1],
    );
    expect(clefs).toEqual(
      scorecardCriteria(DECOUVERTE_V2_GRID).map((c) => c.key),
    );
  });

  it("demande un relevé et non une note, et dit que la formulation ne compte pas", () => {
    expect(CONSIGNE).toContain("un relevé, pas une note");
    expect(CONSIGNE).toContain("Tu ne donnes aucun niveau ni aucun score");
    expect(CONSIGNE).toContain("Le thème compte, pas la formulation.");
  });

  it("recopie la table du produit telle que le calcul l'applique", () => {
    expect(CONSIGNE).toContain(
      `| exploitable | ${scorecardLevelFromCoverage("non", "exploitable")} | ${scorecardLevelFromCoverage("aborde", "exploitable")} | ${scorecardLevelFromCoverage("creuse", "exploitable")} |`,
    );
    expect(CONSIGNE).toContain("| rien | 0 | 1 | 2 |");
  });

  it("annonce la vérification des citations et de leur auteur", () => {
    expect(CONSIGNE).toContain("Le produit vérifie chaque extrait");
    expect(CONSIGNE).toContain("`who`");
  });

  it("dit que l'écoute est mesurée par le produit", () => {
    expect(CONSIGNE).toContain("Mesuré par le produit");
  });

  it("suit la grille qu'on lui donne, sans rien écrire en dur", () => {
    const grille: ScorecardGrid = {
      id: "DECOUVERTE_V2",
      name: "Grille de contrôle",
      intent: "Contrôler.",
      blocks: [
        {
          key: "Z",
          name: "Bloc unique",
          weight: 100,
          criteria: [
            { key: "Z1", label: "Un seul critère", expected: "Un seul attendu." },
          ],
        },
      ],
    };
    const consigne = scorecardGridInstruction(grille);
    expect(consigne).toContain("- **Z1** Un seul critère.");
    expect(consigne).toContain("Niveau 4 : Un seul attendu.");
    expect(consigne).not.toContain("A1");
  });

  it("n'écrit aucun tiret cadratin, dans aucune grille livrée", () => {
    for (const grid of SCORECARD_GRIDS) {
      expect(scorecardGridInstruction(grid)).not.toContain(TIRET_CADRATIN);
    }
  });
});
