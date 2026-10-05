import {
  DISC_READING_INSTRUCTION,
  KISS_COHERENCE_INSTRUCTION,
  KISS_SELLER_SKILLS_INSTRUCTION,
  OBJECTIONS_TREATMENT_INSTRUCTION,
  SONCAS_READING_INSTRUCTION,
} from "@/lib/ai-system-prompt";
import { coachingScoreScaleInstruction } from "@/src/core/domain/coaching-score-scale";
import {
  discScoreScaleInstruction,
  soncasScoreScaleInstruction,
} from "@/src/core/domain/profile-score-scale";
import { DEFAULT_SCORECARD_GRID } from "@/src/core/domain/scorecard-grid";
import { scorecardGridInstruction } from "@/src/core/domain/scorecard-prompt";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

/**
 * Ce que le produit ajoute à une consigne, et que personne ne modifie.
 *
 * La revue du 5 octobre 2026 l'a montré : en lisant les consignes dans
 * Super admin, on ne trouvait ni les critères de la grille ni ce sur quoi la
 * note se fondait, parce que tout cela vit dans le code. L'éditeur l'affiche
 * désormais à côté de la consigne modifiable, en lecture seule.
 *
 * Rend `null` pour une analyse sans partie fixe.
 */
export function fixedPromptPart(kind: AnalysisKindSlug): string | null {
  switch (kind) {
    case "SCORECARD":
      return scorecardGridInstruction(DEFAULT_SCORECARD_GRID);
    case "SONCAS":
      return [SONCAS_READING_INSTRUCTION, soncasScoreScaleInstruction()].join(
        "\n\n",
      );
    case "DISC":
      return [DISC_READING_INSTRUCTION, discScoreScaleInstruction()].join(
        "\n\n",
      );
    case "KISS":
      return [
        KISS_COHERENCE_INSTRUCTION,
        KISS_SELLER_SKILLS_INSTRUCTION,
        coachingScoreScaleInstruction(),
      ].join("\n\n");
    case "OBJECTIONS":
      return OBJECTIONS_TREATMENT_INSTRUCTION;
    default:
      return null;
  }
}
