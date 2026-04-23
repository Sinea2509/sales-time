import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Box,
  Clock,
  Sparkles,
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

export function DashboardKpiCards({
  home,
  showGlobalNote = true,
}: {
  home: OrgDashboardHome;
  showGlobalNote?: boolean;
}) {
  const heroIsDuration = home.avgDurationMin != null;
  const heroTrend = heroIsDuration
    ? home.avgDurationTrendPercent
    : home.tamTrendPercent;
  const heroTrendMode: "up-good" | "down-good" = heroIsDuration
    ? "down-good"
    : "up-good";

  const HeroIcon = heroIsDuration ? Clock : Banknote;
  const heroLabel = heroIsDuration ? "Temps moyen RDV" : "TAM cumulé";

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        showGlobalNote ? "xl:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      <KpiCard
        icon={HeroIcon}
        label={heroLabel}
        trend={<TrendPercentPill percent={heroTrend} mode={heroTrendMode} />}
        footer={
          heroIsDuration ? (
            <>
              TAM estimé :{" "}
              <span className="text-foreground font-medium">
                {eurFormatter.format(home.tamCumuleEur)}
              </span>
            </>
          ) : (
            <>
              {eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} / RDV ·{" "}
              {home.statsWindowDays} jours
            </>
          )
        }
      >
        {heroIsDuration
          ? formatDurationHoursMinutes(home.avgDurationMin!)
          : eurFormatter.format(home.tamCumuleEur)}
      </KpiCard>

      <KpiCard
        icon={Box}
        label="Nb de rdvs"
        trend={
          <TrendPercentPill percent={home.nbRdvsTrendPercent} mode="up-good" />
        }
      >
        {home.nbRdvs}
      </KpiCard>

      <KpiCard
        icon={Wallet}
        label="TUC optimisé"
        trend={<TucDeltaPill points={home.tucTrendPoints} />}
      >
        {home.tucOptimisePercent === null ? "—" : `${home.tucOptimisePercent}%`}
      </KpiCard>

      {showGlobalNote ? (
        <KpiCard
          icon={Sparkles}
          label="Note globale"
          trend={<TucDeltaPill points={home.noteGlobaleTrendPoints} />}
        >
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
        </KpiCard>
      ) : null}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  trend,
  children,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  trend?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6C4DFF]/10 dark:bg-[#6C4DFF]/20">
            <Icon className="size-4 text-[#6C4DFF] dark:text-[#c4b5fd]" />
          </div>
          <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
            {label}
          </p>
        </div>
        {trend}
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{children}</p>
      {footer ? (
        <p className="text-muted-foreground mt-1 text-xs dark:text-zinc-400">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
