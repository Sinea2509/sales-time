import { redirect } from "next/navigation";
import {
  parseStatsWindowDays,
  resolveEligibleStatsWindowDays,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import type { StatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";

/** Redirects when URL `jours` points at a window with insufficient RDV data. */
export function ensureEligibleStatsWindowDays(input: {
  joursParam: string | string[] | undefined;
  counts: StatsWindowRdvsCounts;
  redirectPath: string;
}): StatsWindowDays {
  const requested = parseStatsWindowDays(input.joursParam);
  const resolved = resolveEligibleStatsWindowDays(requested, input.counts);
  if (resolved !== requested) {
    const q = new URLSearchParams();
    q.set("jours", String(resolved));
    redirect(`${input.redirectPath}?${q.toString()}`);
  }
  return resolved;
}
