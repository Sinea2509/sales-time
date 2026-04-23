"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/lib/dashboard-stats-window";
import { cn } from "@/lib/utils";

const LABELS: Record<StatsWindowDays, string> = {
  7: "7j",
  30: "30j",
  90: "90j",
};

export function DashboardStatsPeriodSelect(props: {
  value: StatsWindowDays;
  /** Style pour fond sombre (tableau de bord). */
  theme?: "default" | "dark";
}) {
  const dark = props.theme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "relative inline-flex items-center text-sm whitespace-nowrap",
        dark ? "text-zinc-400" : "text-muted-foreground",
      )}
    >
      <span className="sr-only">Période des statistiques</span>
      <select
        aria-label="Période des statistiques (jours glissants)"
        className={cn(
          "h-8 appearance-none bg-transparent pr-5 pl-1 text-sm font-medium outline-none",
          "focus-visible:ring-[0] disabled:opacity-60",
          dark
            ? "text-zinc-200"
            : "text-foreground",
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
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-0 size-4",
          dark ? "text-zinc-400" : "text-muted-foreground",
        )}
      />
    </div>
  );
}
