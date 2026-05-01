import { normalizePhraseKey } from "@/lib/onboarding-shared-default-phrases";

/** Fusionne des formulations sans doublon (clé normalisée), même logique onboarding / Coach IA. */
export function mergeUniqueCoachPhrases(
  existing: string[],
  adds: string[],
): string[] {
  const keys = new Set(existing.map((t) => normalizePhraseKey(t)));
  const out = [...existing];
  for (const raw of adds) {
    const t = raw.trim();
    if (t.length === 0) continue;
    const k = normalizePhraseKey(t);
    if (keys.has(k)) continue;
    keys.add(k);
    out.push(t);
  }
  return out;
}
