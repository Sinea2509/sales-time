import { soncasResultSchema } from "@/lib/analysis-result-zod";

/** Score 0–100 à partir du dernier résultat SONCAS (moyenne des 6 leviers). */
export function salesScoreFromSoncasResult(result: unknown): number | null {
  const parsed = soncasResultSchema.safeParse(result);
  if (!parsed.success) return null;
  const d = parsed.data.drivers;
  const scores = [
    d.securite.score,
    d.orgueil.score,
    d.nouveaute.score,
    d.confort.score,
    d.argent.score,
    d.sympathie.score,
  ];
  return Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  );
}
