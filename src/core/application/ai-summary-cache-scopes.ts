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

export function orgKissRollupScopeKey(
  statsWindowDays: StatsWindowDays,
  sellerUserId?: string | null,
): string {
  const scopePart = sellerUserId ? `seller:${sellerUserId}` : "org";
  return `ORG_KISS_ROLLUP:${scopePart}:${statsWindowDays}`;
}
