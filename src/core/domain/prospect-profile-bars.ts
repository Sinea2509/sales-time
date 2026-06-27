import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import {
  DISC_BAR_CLASS,
  DISC_PILL_CLASS,
  SONCAS_BAR_CLASS,
  SONCAS_PILL_CLASS,
  type DiscBarDatum,
  type SoncasBarDatum,
} from "@/src/core/domain/seller-affinity-from-meetings";
import { normalizeScoresToHundred } from "@/src/core/domain/normalize-scores-to-hundred";

const DISC_KEYS = ["D", "I", "S", "C"] as const;

const DISC_LABEL_FR: Record<(typeof DISC_KEYS)[number], string> = {
  D: "Dominant",
  I: "Influent",
  S: "Stable",
  C: "Conforme",
};

const SONCAS_KEYS = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;

const SONCAS_LABEL_FR: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function discBarsFromResult(result: DiscAnalysisResult): DiscBarDatum[] {
  const normalized = normalizeScoresToHundred(result.scores);
  const items: DiscBarDatum[] = DISC_KEYS.map((key) => ({
    key,
    label: DISC_LABEL_FR[key],
    pct: clampPct(normalized[key] ?? 0),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

export function soncasBarsFromResult(
  result: SoncasAnalysisResult,
): SoncasBarDatum[] {
  const rawScores = Object.fromEntries(
    SONCAS_KEYS.map((key) => [key, result.drivers[key].score]),
  );
  const normalized = normalizeScoresToHundred(rawScores);
  const items: SoncasBarDatum[] = SONCAS_KEYS.map((key) => ({
    key,
    label: SONCAS_LABEL_FR[key],
    pct: clampPct(normalized[key] ?? 0),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

export function discBarItemsForUi(result: DiscAnalysisResult) {
  return discBarsFromResult(result).map((row) => ({
    ...row,
    barClass: DISC_BAR_CLASS[row.key],
    pillClass: DISC_PILL_CLASS[row.key],
  }));
}

export function soncasBarItemsForUi(result: SoncasAnalysisResult) {
  return soncasBarsFromResult(result).map((row) => ({
    ...row,
    barClass: SONCAS_BAR_CLASS[row.key],
    pillClass: SONCAS_PILL_CLASS[row.key],
  }));
}
