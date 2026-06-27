import {
  ArrowDown,
  ArrowUp,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { isStatsWindowEligibleForTrends } from "@/src/core/domain/dashboard-stats-window";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { cn } from "@/lib/utils";

const basePill =
  "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums";

const dashboardVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/35 bg-emerald-500/15 text-emerald-100",
      bad: "border-rose-500/35 bg-rose-500/15 text-rose-100",
      neutral: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
    },
  },
  defaultVariants: { intent: "neutral" },
});

const adminVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-100",
      bad: "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-100",
      neutral:
        "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    },
  },
  defaultVariants: { intent: "neutral" },
});

export type TrendDirectionMode = "up-good" | "down-good" | "neutral";

function deltaDisplayMagnitude(delta: number): number {
  const absVal = Math.abs(delta);
  return Math.abs(absVal % 1) < 0.001
    ? Math.round(absVal)
    : Math.round(absVal * 10) / 10;
}

function resolveIntent(
  delta: number,
  mode: TrendDirectionMode,
): NonNullable<VariantProps<typeof dashboardVariants>["intent"]> {
  if (delta === 0 || mode === "neutral") return "neutral";
  const good = mode === "up-good" ? delta > 0 : delta < 0;
  const bad = mode === "up-good" ? delta < 0 : delta > 0;
  if (good) return "good";
  if (bad) return "bad";
  return "neutral";
}

const kpiVsPreviousVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100",
      bad: "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-100",
      neutral:
        "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    },
  },
  defaultVariants: { intent: "neutral" },
});

export type KpiVsPreviousBadgeProps = {
  /** Variation brute (positif = hausse). Bon/mauvais selon `mode`. */
  delta: number | null;
  mode: TrendDirectionMode;
  /**
   * `percent` = variation relative (suffixe %).
   * `percentagePoints` = écart entre deux pourcentages, ex. TUC déjà en % (suffixe pts).
   */
  deltaDisplay?: "percent" | "percentagePoints";
  /** Masque le badge si l'échantillon courant est trop faible. */
  minSampleCount?: number;
  currentSampleCount?: number;
  /** Fenêtre stats active — affiche « vs N j. préc. » sur le badge. */
  statsWindowDays?: StatsWindowDays;
  className?: string;
};

function statsWindowReferenceLabel(days: StatsWindowDays): string {
  return `vs ${days} j. préc.`;
}

/**
 * Badge « vs période précédente » : valeur absolue sans signe + couleur/icône (favorable / défavorable).
 */
export function KpiVsPreviousBadge({
  delta,
  mode,
  deltaDisplay = "percent",
  minSampleCount = 0,
  currentSampleCount,
  statsWindowDays,
  className,
}: KpiVsPreviousBadgeProps) {
  if (delta === null || Number.isNaN(delta)) return null;
  if (
    minSampleCount > 0 &&
    (currentSampleCount == null ||
      !isStatsWindowEligibleForTrends(currentSampleCount) ||
      currentSampleCount < minSampleCount)
  ) {
    return null;
  }
  const displayMagnitude = deltaDisplayMagnitude(delta);
  if (displayMagnitude === 0) return null;
  const intent = resolveIntent(delta, mode);
  const Icon = delta > 0 ? TrendingUp : TrendingDown;
  const textRaw =
    Math.abs(displayMagnitude % 1) < 0.001
      ? String(Math.round(displayMagnitude))
      : String(displayMagnitude);
  const textFr = textRaw.replace(".", ",");
  const isPp = deltaDisplay === "percentagePoints";
  const referenceLabel =
    statsWindowDays != null ? statsWindowReferenceLabel(statsWindowDays) : null;
  const periodHint = isPp
    ? `Écart vs les ${statsWindowDays ?? "N"} jours précédents, en points de pourcentage du TUC`
    : `Variation vs les ${statsWindowDays ?? "N"} jours précédents (même durée que la sélection)`;
  const ariaLabel =
    delta > 0
      ? isPp
        ? `${periodHint} — hausse de ${textFr} points.`
        : `${periodHint} — hausse de ${textFr} %.`
      : isPp
        ? `${periodHint} — baisse de ${textFr} points.`
        : `${periodHint} — baisse de ${textFr} %.`;
  return (
    <span
      className={cn(
        kpiVsPreviousVariants({ intent }),
        "flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1",
        className,
      )}
      title={periodHint}
      aria-label={ariaLabel}
    >
      <span className="inline-flex items-center gap-0.5">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums" aria-hidden>
          {textFr}
          {isPp ? " pts" : "%"}
        </span>
      </span>
      {referenceLabel ? (
        <span className="text-[10px] font-normal opacity-80">{referenceLabel}</span>
      ) : null}
    </span>
  );
}

export type TrendPercentPillProps = {
  percent: number | null;
  mode: TrendDirectionMode;
  /** `admin` matches light dashboard cards; `dashboard` matches dark KPI tiles. */
  surface?: "dashboard" | "admin";
  className?: string;
};

export function TrendPercentPill({
  percent,
  mode,
  surface = "dashboard",
  className,
}: TrendPercentPillProps) {
  if (percent === null) return null;
  const intent = resolveIntent(percent, mode);
  const Icon = percent > 0 ? ArrowUp : ArrowDown;
  const variants = surface === "admin" ? adminVariants : dashboardVariants;
  return (
    <span className={cn(variants({ intent }), className)}>
      <Icon className="size-3" />
      {percent > 0 ? "+" : ""}
      {percent}%
    </span>
  );
}

const pointsDashboardVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/35 bg-emerald-500/15 text-emerald-100",
      bad: "border-rose-500/35 bg-rose-500/15 text-rose-100",
      neutral: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
    },
  },
  defaultVariants: { intent: "neutral" },
});

const pointsAdminVariants = cva(basePill, {
  variants: {
    intent: {
      good: "border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-100",
      bad: "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-100",
      neutral:
        "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    },
  },
  defaultVariants: { intent: "neutral" },
});

export type TrendPointsPillProps = {
  points: number | null;
  suffix?: string;
  /** `admin` for light dashboard cards; `dashboard` for dark KPI tiles. */
  surface?: "dashboard" | "admin";
  className?: string;
};

/** Delta pill for TUC / note globale (points, not %). */
export function TrendPointsPill({
  points,
  suffix = "pts",
  surface = "dashboard",
  className,
}: TrendPointsPillProps) {
  if (points === null || Number.isNaN(points)) return null;
  const displayMagnitude = deltaDisplayMagnitude(points);
  if (displayMagnitude === 0) return null;
  const intent = resolveIntent(points, "up-good");
  const Icon = points > 0 ? ArrowUp : ArrowDown;
  const text =
    Math.abs(displayMagnitude % 1) < 0.05
      ? String(Math.round(displayMagnitude))
      : String(displayMagnitude);
  const variants =
    surface === "admin" ? pointsAdminVariants : pointsDashboardVariants;
  return (
    <span className={cn(variants({ intent }), className)}>
      <Icon className="size-3" />
      {points > 0 ? "+" : ""}
      {text} {suffix}
    </span>
  );
}
