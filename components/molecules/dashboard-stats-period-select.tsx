"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/lib/dashboard-stats-window";
import { cn } from "@/lib/utils";

const LABELS: Record<StatsWindowDays, string> = {
  7: "7 jours",
  30: "30 jours",
  90: "90 jours",
};

export function DashboardStatsPeriodSelect(props: {
  value: StatsWindowDays;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
      <span className="sr-only">Période des statistiques</span>
      <select
        aria-label="Période des statistiques (jours glissants)"
        className={cn(
          "border-input bg-background text-foreground h-9 min-w-[9.5rem] rounded-md border px-2.5 py-1 text-sm shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:opacity-60",
        )}
        value={String(props.value)}
        disabled={pending}
        onChange={(e) => {
          const jours = e.target.value;
          const next = new URLSearchParams(searchParams.toString());
          next.set("jours", jours);
          startTransition(() => {
            router.replace(`${pathname}?${next.toString()}`);
          });
        }}
      >
        {STATS_WINDOW_DAYS_OPTIONS.map((d) => (
          <option key={d} value={String(d)}>
            {LABELS[d]}
          </option>
        ))}
      </select>
    </label>
  );
}
