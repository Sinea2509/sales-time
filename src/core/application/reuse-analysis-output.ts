import { createHash } from "node:crypto";
import {
  analysisReuseMaterial,
  analysisReuseScopeKey,
} from "@/src/core/domain/analysis-reuse-key";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";

/**
 * Rend le résultat d'un appel identique déjà fait, sinon fait l'appel et le
 * garde.
 *
 * Ce qui est gardé, c'est la réponse brute du modèle, avant les règles du
 * produit (preuves, plafonds, calcul du score). Ces règles se rejouent à
 * chaque fois : elles sont déterministes, et une règle corrigée s'applique
 * ainsi aux réponses déjà gardées.
 *
 * Sans cache disponible, l'appel se fait simplement.
 */
export async function reuseAnalysisOutput<T>(
  deps: { aiSummaryCache?: AiSummaryCacheRepositoryPort },
  input: {
    organizationId: string;
    kind: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    compute: () => Promise<T>;
  },
): Promise<{ value: T; reused: boolean }> {
  const cache = deps.aiSummaryCache;
  if (!cache) return { value: await input.compute(), reused: false };
  const scopeKey = analysisReuseScopeKey(input.kind);
  const fingerprint = createHash("sha256")
    .update(analysisReuseMaterial(input))
    .digest("hex");
  const kept = await cache
    .get({
      organizationId: input.organizationId,
      scopeKey,
      meetingsFingerprint: fingerprint,
    })
    .catch(() => null);
  if (kept != null) return { value: kept as T, reused: true };
  const value = await input.compute();
  await cache
    .set({
      organizationId: input.organizationId,
      scopeKey,
      meetingsFingerprint: fingerprint,
      payload: value,
    })
    .catch(() => undefined);
  return { value, reused: false };
}
