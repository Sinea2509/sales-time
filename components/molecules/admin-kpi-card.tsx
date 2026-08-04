import { TrendingUp, TrendingDown } from "lucide-react";
import { statAccentStyles, type StatAccent } from "@/lib/stat-accent-styles";
import { cn } from "@/lib/utils";

type Props = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend?: number | null;
  footer?: string;
  accent?: StatAccent;
};

export function AdminKpiCard({
  icon: Icon,
  label,
  value,
  trend,
  footer,
  accent = "blue",
}: Props) {
  const colors = statAccentStyles[accent];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            colors.bg,
          )}
        >
          <Icon className={cn("size-5", colors.icon)} />
        </div>
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              trend >= 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums text-foreground dark:text-zinc-50">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground dark:text-zinc-400">
          {label}
        </p>
      </div>
      {footer && (
        <p className="mt-2 text-[11px] text-muted-foreground dark:text-zinc-400">
          {footer}
        </p>
      )}
    </div>
  );
}
