import { discResultSchema } from "./analysis-result-zod";

export const DISC_DIMENSION_KEYS = ["D", "I", "S", "C"] as const;

export type DiscDimensionKey = (typeof DISC_DIMENSION_KEYS)[number];

export type DiscScoreAverages = Record<DiscDimensionKey, number | null>;

/** Moyenne des scores DISC (D, I, S, C) sur une liste de résultats bruts. */
export function averageDiscScores(discResults: unknown[]): DiscScoreAverages {
  const sums: Record<DiscDimensionKey, number> = { D: 0, I: 0, S: 0, C: 0 };
  let count = 0;

  for (const raw of discResults) {
    const parsed = discResultSchema.safeParse(raw);
    if (!parsed.success) continue;
    count += 1;
    for (const k of DISC_DIMENSION_KEYS) {
      sums[k] += parsed.data.scores[k];
    }
  }

  if (count === 0) {
    return { D: null, I: null, S: null, C: null };
  }

  return {
    D: Math.round(sums.D / count),
    I: Math.round(sums.I / count),
    S: Math.round(sums.S / count),
    C: Math.round(sums.C / count),
  };
}
