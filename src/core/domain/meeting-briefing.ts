import { discResultSchema, soncasResultSchema } from "./analysis-result-zod";
import { kissResultSchema } from "./kiss-result-zod";
import { challengesForDisplay } from "./meeting-challenges";
import { objectionsResultSchema } from "./objections-result-zod";
import { scorecardResultView } from "./scorecard-result-view";
import { scorecardResultSchema } from "./scorecard-result-zod";
import { visitReportEssentials } from "./visit-report";

/** Assez pour préparer un rendez-vous, sans noyer le modèle sous l'historique. */
const LIST_MAX = 4;

/** Ce que le briefing lit d'un rendez-vous déjà tenu. */
export type MeetingBriefingSource = {
  meetingAt: string;
  meetingType: string | null;
  pipelineStage: string | null;
  visitReportDraft: string | null;
  analyses: readonly { kind: string; result: unknown }[];
};

/**
 * Un rendez-vous passé, tel que le modèle le reçoit pour préparer le suivant.
 *
 * Le briefing ne lisait que le résumé du coaching et les profils : les
 * objections restées ouvertes, les défis, la question en or, les manques de la
 * grille et l'essentiel du compte rendu existaient déjà, et il ne les voyait
 * pas. Une analyse absente ou illisible laisse son champ vide : l'historique
 * d'un rendez-vous ancien vaut mieux que pas d'historique.
 */
export function meetingBriefingHistoryEntry(source: MeetingBriefingSource) {
  const read = <T>(
    kind: string,
    schema: {
      safeParse: (v: unknown) => { success: boolean; data?: T };
    },
  ): T | null => {
    const analysis = source.analyses.find((a) => a.kind === kind);
    if (!analysis) return null;
    const parsed = schema.safeParse(analysis.result);
    return parsed.success ? (parsed.data ?? null) : null;
  };

  const kiss = read("KISS", kissResultSchema);
  const disc = read("DISC", discResultSchema);
  const soncas = read("SONCAS", soncasResultSchema);
  const objections = read("OBJECTIONS", objectionsResultSchema);
  const scorecard = read("SCORECARD", scorecardResultSchema);

  return {
    meetingAt: source.meetingAt,
    meetingType: source.meetingType,
    stage: source.pipelineStage,
    summary: kiss?.summary ?? null,
    essentials: visitReportEssentials(source.visitReportDraft ?? ""),
    disc: disc ? { dominant: disc.dominant, summary: disc.summary } : null,
    soncas: soncas
      ? { dominant: soncas.dominant, summary: soncas.summary }
      : null,
    goldenQuestion: kiss?.goldenQuestion ?? null,
    challenges: challengesForDisplay(kiss),
    customQuestions: kiss?.start.slice(0, LIST_MAX) ?? [],
    openPoints: kiss?.improve.slice(0, LIST_MAX) ?? [],
    objections: (objections?.objections ?? [])
      .slice(0, LIST_MAX)
      .map(({ objection, outcome, response, suggestion }) => ({
        objection,
        outcome,
        response,
        suggestion,
      })),
    missing: scorecard
      ? scorecardResultView(scorecard)
          .pointsLost.slice(0, LIST_MAX)
          .map((p) => ({
            criterion: p.label,
            missing: p.evidence,
            advice: p.whatToSayInstead,
          }))
      : [],
  };
}
