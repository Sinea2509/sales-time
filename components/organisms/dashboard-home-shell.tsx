import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Box,
  Clock,
  Wallet,
} from "lucide-react";
import { DashboardMeetingRowActions } from "@/components/molecules/dashboard-meeting-row-actions";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { meetingEtapeLabel, meetingEtapePillClass } from "@/lib/meeting-etape-pill";
import { prospectInitials } from "@/lib/prospect-initials";
import { cn } from "@/lib/utils";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
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

export function DashboardHomeShell({ home }: { home: OrgDashboardHome }) {
  const heroIsDuration = home.avgDurationMin != null;
  const heroTrend = heroIsDuration
    ? home.avgDurationTrendPercent
    : home.tamTrendPercent;
  const heroTrendMode: "up-good" | "down-good" = heroIsDuration
    ? "down-good"
    : "up-good";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Mes statistiques
        </h2>
        <Suspense
          fallback={
            <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
          }
        >
          <DashboardStatsPeriodSelect value={home.statsWindowDays} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <TrendPercentPill
              percent={home.nbRdvsTrendPercent}
              mode="up-good"
            />
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/rendez-vous/nouveau"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 rounded-lg border-[#6C4DFF]/25 bg-[#6C4DFF]/10 px-4 text-[#5a3fd9] hover:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]",
          )}
        >
          Préparer un RDV
        </Link>
        <Link
          href="/dashboard/analyse"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-10 gap-1 rounded-lg border-0 bg-[#6C4DFF] px-4 text-white hover:bg-[#5a3fd9]",
          )}
        >
          <span className="text-lg leading-none">+</span>
          Analyser un nouveau RDV
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Mes rendez-vous
        </h2>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Prospect
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase sm:table-cell dark:text-zinc-500">
                    Potentiel
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Date du RDV
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Étape
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase md:table-cell dark:text-zinc-500">
                    SalesScore
                  </th>
                  <th className="text-muted-foreground w-12 px-4 py-3.5 dark:text-zinc-500" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {home.recentMeetings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center dark:text-zinc-500"
                    >
                      Aucun rendez-vous.
                    </td>
                  </tr>
                ) : (
                  home.recentMeetings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {prospectInitials(m.prospectName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                              {m.prospectName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs dark:text-zinc-500">
                              Entreprise
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums sm:table-cell dark:text-zinc-400">
                        {eurCompact.format(ESTIMATED_TAM_EUR_PER_RDV)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums dark:text-zinc-400">
                        {dateShort.format(new Date(m.meetingAt))}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meetingEtapePillClass(m.outcome),
                          )}
                        >
                          {meetingEtapeLabel(m.outcome)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                        {m.salesScore != null ? (
                          <span className="text-zinc-900 text-base font-semibold tabular-nums dark:text-zinc-100">
                            {m.salesScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground dark:text-zinc-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <DashboardMeetingRowActions
                          meetingId={m.id}
                          prospectName={m.prospectName}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
