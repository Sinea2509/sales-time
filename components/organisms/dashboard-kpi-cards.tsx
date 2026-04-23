import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Box,
  Clock,
  Star,
  Wallet,
} from "lucide-react";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { cn } from "@/lib/utils";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function TrendPercentPill({
  percent,
  mode,
}: {
  percent: number | null;
  mode: "up-good" | "down-good";
}) {
  if (percent === null) return null;
  if (percent === 0) {
    return (
      <span className="border-zinc-600 bg-zinc-800/80 text-zinc-300 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums">
        0%
      </span>
    );
  }
  const good = mode === "up-good" ? percent > 0 : percent < 0;
  const bad = mode === "up-good" ? percent < 0 : percent > 0;
  const cls = good
    ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
    : bad
      ? "border-rose-500/35 bg-rose-500/15 text-rose-100"
      : "border-zinc-600 bg-zinc-800/80 text-zinc-300";
  const Icon = percent > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        cls,
      )}
    >
      <Icon className="size-3" />
      {percent > 0 ? "+" : ""}
      {percent}%
    </span>
  );
}

function TucDeltaPill({ points }: { points: number | null }) {
  if (points === null) return null;
  if (points === 0) {
    return (
      <span className="border-zinc-600 bg-zinc-800/80 text-zinc-300 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums">
        0 pts
      </span>
    );
  }
  const good = points > 0;
  const bad = points < 0;
  const cls = good
    ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-100"
    : bad
      ? "border-rose-500/35 bg-rose-500/15 text-rose-100"
      : "border-zinc-600 bg-zinc-800/80 text-zinc-300";
  const Icon = points > 0 ? ArrowUp : ArrowDown;
  const text =
    Math.abs(points % 1) < 0.05 ? String(Math.round(points)) : String(points);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        cls,
      )}
    >
      <Icon className="size-3" />
      {points > 0 ? "+" : ""}
      {text} pts
    </span>
  );
}

export function DashboardKpiCards({ home }: { home: OrgDashboardHome }) {
  const heroIsDuration = home.avgDurationMin != null;
  const heroTrend = heroIsDuration
    ? home.avgDurationTrendPercent
    : home.tamTrendPercent;
  const heroTrendMode: "up-good" | "down-good" = heroIsDuration
    ? "down-good"
    : "up-good";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-violet-900/40 bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-950 p-5 text-white shadow-lg">
        <div className="absolute end-3 top-3">
          <TrendPercentPill percent={heroTrend} mode={heroTrendMode} />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/25 ring-1 ring-violet-400/30">
            {heroIsDuration ? (
              <Clock className="size-5 text-violet-200" />
            ) : (
              <Banknote className="size-5 text-violet-200" />
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-violet-200/90">
              {heroIsDuration ? "Temps moyen RDV" : "TAM cumulé"}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {heroIsDuration
                ? formatDurationHoursMinutes(home.avgDurationMin!)
                : eurFormatter.format(home.tamCumuleEur)}
            </p>
            {heroIsDuration ? (
              <p className="text-violet-300/80 mt-1 text-xs">
                TAM estimé :{" "}
                <span className="font-medium text-white">
                  {eurFormatter.format(home.tamCumuleEur)}
                </span>
              </p>
            ) : (
              <p className="text-violet-300/80 mt-1 text-xs">
                {eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} / RDV ·{" "}
                {home.statsWindowDays} jours
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
            <Box className="size-5 text-violet-600 dark:text-violet-300" />
          </div>
          <TrendPercentPill percent={home.nbRdvsTrendPercent} mode="up-good" />
        </div>
        <p className="text-muted-foreground mt-4 text-sm font-medium dark:text-zinc-400">
          Nb de rdvs
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{home.nbRdvs}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
            <Wallet className="size-5 text-violet-600 dark:text-violet-300" />
          </div>
          <TucDeltaPill points={home.tucTrendPoints} />
        </div>
        <p className="text-muted-foreground mt-4 text-sm font-medium dark:text-zinc-400">
          TUC optimisé
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {home.tucOptimisePercent === null
            ? "—"
            : `${home.tucOptimisePercent}%`}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
            <Star className="size-5 text-amber-600 dark:text-amber-300" />
          </div>
          <TucDeltaPill points={home.noteGlobaleTrendPoints} />
        </div>
        <p className="text-muted-foreground mt-4 text-sm font-medium dark:text-zinc-400">
          Note globale
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {home.noteGlobaleOn5 === null ? (
            "—"
          ) : (
            <>
              {home.noteGlobaleOn5.toFixed(1)}
              <span className="text-muted-foreground ml-1 text-lg font-medium dark:text-zinc-400">
                / 5
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
