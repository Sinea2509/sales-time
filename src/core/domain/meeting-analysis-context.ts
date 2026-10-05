import { scorecardGridById, scorecardCriteria } from "./scorecard-grid";
import type { ScorecardGrid } from "./scorecard-grid";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";
import type { TalkShare } from "./talk-share-from-transcript";
import { TALK_SHARE_CEILING_PCT } from "./talk-share-from-transcript";

/**
 * « Ce rendez-vous » : ce que le produit sait déjà, joint aux consignes
 * d'analyse.
 *
 * Le type de rendez-vous décide de ce qu'on peut reprocher au commercial ; la
 * répartition de la parole est mesurée, pas devinée ; le relevé de la grille
 * permet au coaching KISS de ne pas la contredire. Sans ce bloc, chaque
 * analyse lisait le transcript dans son coin, et la revue du 5 octobre a
 * trouvé un KISS qui félicitait pour une découverte que la grille jugeait
 * courte.
 */
export function meetingAnalysisContext(input: {
  meetingType: string | null;
  pipelineStage: string | null;
  grid: ScorecardGrid | null;
  talkShare: TalkShare | null;
  scorecard?: ScorecardAnalysisResult | null;
}): string {
  const lines: string[] = ["## Ce rendez-vous (faits établis par le produit)"];
  const type = input.meetingType?.trim() || input.pipelineStage?.trim();
  lines.push(
    type
      ? `- Type de rendez-vous : ${type}${input.grid ? ` (grille « ${input.grid.name} »)` : ""}.`
      : "- Type de rendez-vous : non précisé ; lis-le comme un premier rendez-vous de découverte.",
  );
  if (input.grid?.notExpected) {
    lines.push(`- Ce qui n'est pas attendu : ${input.grid.notExpected}`);
  }
  if (input.talkShare) {
    const s = input.talkShare;
    lines.push(
      `- Parole mesurée : ${s.commercialLabel} (commercial) ${s.commercialPct} %, ${s.prospectLabel} ${s.prospectPct} %. Plus longue prise de parole du commercial : ${s.longestCommercialRunWords} mots. Plafond conseillé : ${TALK_SHARE_CEILING_PCT} % pour le commercial.`,
    );
  }
  const scorecard = input.scorecard;
  if (scorecard) {
    const grid = scorecardGridById(scorecard.gridId);
    const labels = new Map(
      grid ? scorecardCriteria(grid).map((c) => [c.key, c.label]) : [],
    );
    const releveTexte = scorecard.criteria
      .map((c) => {
        const label = labels.get(c.key) ?? c.key;
        const parts = [`  - ${c.key} ${label} : niveau ${c.level} sur 4.`];
        if (c.learned) parts.push(`Obtenu : ${c.learned}`);
        if (c.missing) parts.push(`Manque : ${c.missing}`);
        return parts.join(" ");
      })
      .join("\n");
    lines.push(
      `- Grille : ${scorecard.overallScore} sur 100. Relevé critère par critère :\n${releveTexte}`,
    );
  }
  return lines.join("\n");
}
