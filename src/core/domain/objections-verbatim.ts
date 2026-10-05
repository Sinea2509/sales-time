import type { ObjectionsAnalysisResult } from "./objections-result-zod";
import { evidenceWords, isExcerptInSource } from "./transcript-evidence";

/**
 * Marque les objections qui ne sont pas les mots exacts du prospect.
 *
 * L'essai du 5 octobre 2026 affichait entre guillemets « Il faut que j'en
 * parle à mon directeur », une phrase que la prospect n'a jamais dite. Une
 * objection retrouvée mot pour mot dans les paroles du prospect (ou dans le
 * transcript quand il ne distingue pas ses intervenants) reste une citation ;
 * les autres s'affichent « En substance », sans guillemets.
 */
export function markObjectionsVerbatim(
  result: ObjectionsAnalysisResult,
  prospectText: string,
): ObjectionsAnalysisResult {
  const words = evidenceWords(prospectText);
  return {
    ...result,
    objections: result.objections.map((o) => ({
      ...o,
      verbatim: isExcerptInSource(
        o.objection.replace(/^«\s*|\s*»$/g, ""),
        words,
      ),
    })),
  };
}
