import { soncasResultSchema } from "./analysis-result-zod";

const DRIVER_KEYS = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;

export type SoncasDriverAverages = Record<
  (typeof DRIVER_KEYS)[number],
  number | null
>;

/** Moyenne des scores par levier SONCAS sur une liste de résultats bruts. */
export function averageSoncasDriverScores(
  soncasResults: unknown[],
): SoncasDriverAverages {
  const sums: Record<(typeof DRIVER_KEYS)[number], number> = {
    securite: 0,
    orgueil: 0,
    nouveaute: 0,
    confort: 0,
    argent: 0,
    sympathie: 0,
  };
  const counts: Record<(typeof DRIVER_KEYS)[number], number> = {
    securite: 0,
    orgueil: 0,
    nouveaute: 0,
    confort: 0,
    argent: 0,
    sympathie: 0,
  };

  for (const raw of soncasResults) {
    const parsed = soncasResultSchema.safeParse(raw);
    if (!parsed.success) continue;
    const d = parsed.data.drivers;
    for (const k of DRIVER_KEYS) {
      sums[k] += d[k].score;
      counts[k] += 1;
    }
  }

  const out: SoncasDriverAverages = {
    securite: null,
    orgueil: null,
    nouveaute: null,
    confort: null,
    argent: null,
    sympathie: null,
  };
  for (const k of DRIVER_KEYS) {
    out[k] = counts[k] > 0 ? Math.round(sums[k] / counts[k]) : null;
  }
  return out;
}
