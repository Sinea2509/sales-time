import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "blue" | "emerald" | "violet" | "amber";

const accentMap: Record<Accent, { bg: string; icon: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

type Props = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend?: number | null;
  footer?: string;
  accent?: Accent;
};

export function AdminKpiCard({
  icon: Icon,
  label,
  value,
  trend,
  footer,
  accent = "blue",
}: Props) {
  const colors = accentMap[accent];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>
      {footer && (
        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          {footer}
        </p>
      )}
    </div>
  );
}
