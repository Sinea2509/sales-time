import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

export function sellerPerformanceScopeKey(
  sellerUserId: string,
  statsWindowDays: StatsWindowDays,
): string {
  return `SELLER_PERFORMANCE:${sellerUserId}:${statsWindowDays}`;
}

export function sellerAffinityScopeKey(
  sellerUserId: string,
  statsWindowDays: StatsWindowDays,
): string {
  return `SELLER_AFFINITY:${sellerUserId}:${statsWindowDays}`;
}

export function sellerCoachingScopeKey(input: {
  sellerUserId: string | null;
  statsWindowDays: StatsWindowDays;
  audience: "manager" | "commercial";
}): string {
  const sellerPart = input.sellerUserId ?? "org";
  return `SELLER_COACHING:${sellerPart}:${input.statsWindowDays}:${input.audience}`;
}

/**
 * La clé du récit KISS mis en cache.
 *
 * `audience` en fait partie, comme dans `sellerCoachingScopeKey` : le texte est
 * écrit par un prompt dont l'annexe change selon le lecteur, « ce que vous
 * devez valoriser chez lui » pour un manager, « ce que vous avez bien fait »
 * pour le commercial lui-même. Les deux portent sur les mêmes rendez-vous, donc
 * sur la même empreinte : sans ce dernier segment, le premier des deux écrans
 * ouvert écrirait la ligne, et le second lirait un texte rédigé pour l'autre.
 *
 * Il s'écrit en dernier pour que la clé se lise du plus large au plus étroit,
 * comme celle du coaching.
 */
export function orgKissRollupScopeKey(input: {
  statsWindowDays: StatsWindowDays;
  sellerUserId?: string | null;
  audience: "manager" | "commercial";
}): string {
  const scopePart = input.sellerUserId ? `seller:${input.sellerUserId}` : "org";
  return `ORG_KISS_ROLLUP:${scopePart}:${input.statsWindowDays}:${input.audience}`;
}
