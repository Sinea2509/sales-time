import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

type AnalysePagePeriodFallbackProps = {
  value: StatsWindowDays;
  disabledDays?: StatsWindowDays[];
};

export function AnalysePagePeriodFallback({
  value,
  disabledDays = [],
}: AnalysePagePeriodFallbackProps) {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
      }
    >
      <DashboardStatsPeriodSelect value={value} disabledDays={disabledDays} />
    </Suspense>
  );
}
