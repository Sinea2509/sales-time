import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import type {
  StatsWindowDays,
  StatsWindowPreset,
  StatsWindowRange,
} from "@/src/core/domain/dashboard-stats-window";

type AnalysePagePeriodFallbackProps = {
  value: StatsWindowDays;
  range?: StatsWindowRange | null;
  disabledDays?: StatsWindowDays[];
  widerWindow?: StatsWindowPreset | null;
};

export function AnalysePagePeriodFallback({
  value,
  range = null,
  disabledDays = [],
  widerWindow = null,
}: AnalysePagePeriodFallbackProps) {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
      }
    >
      <DashboardStatsPeriodSelect
        value={value}
        range={range}
        disabledDays={disabledDays}
        widerWindow={widerWindow}
      />
    </Suspense>
  );
}
