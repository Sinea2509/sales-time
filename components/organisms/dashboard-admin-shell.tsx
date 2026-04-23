import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Store,
  TrendingUp,
} from "lucide-react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MeetingMatrixScatter } from "@/components/organisms/meeting-matrix-scatter";
import { OrgSoncasRadar } from "@/components/organisms/org-soncas-radar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/lib/dashboard-estimates";
import { cn } from "@/lib/utils";
import type { OrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function AdminTrendPill({
  percent,
  mode,
}: {
  percent: number | null;
  mode: "up-good" | "down-good";
}) {
  if (percent === null) return null;
  if (percent === 0) {
    return (
      <span className="border-zinc-200 bg-zinc-50 text-zinc-500 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        0%
      </span>
    );
  }
  const good = mode === "up-good" ? percent > 0 : percent < 0;
  const bad = mode === "up-good" ? percent < 0 : percent > 0;
  const cls = good
    ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-100"
    : bad
      ? "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-100"
      : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800";
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

function AdminHeroKpiRow({ admin }: { admin: OrgAdminDashboard }) {
  const { home, avgSalesScoreInWindow, activeCommercialsCount, kpis } = admin;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6C4DFF]/10 dark:bg-[#6C4DFF]/20">
              <Banknote className="size-4 text-[#6C4DFF] dark:text-[#c4b5fd]" />
            </div>
            <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
              CA estimé (équipe)
            </p>
          </div>
          <AdminTrendPill percent={home.tamTrendPercent} mode="up-good" />
        </div>
        <p className="mt-4 text-3xl font-semibold tabular-nums">
          {eurFormatter.format(home.tamCumuleEur)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs dark:text-zinc-400">
          {eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} / RDV ·{" "}
          {home.statsWindowDays} jours ·
          Taux de gain{" "}
          {kpis.winRatePercent == null ? "—" : `${kpis.winRatePercent}%`}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6C4DFF]/10 dark:bg-[#6C4DFF]/20">
              <TrendingUp className="size-4 text-[#6C4DFF] dark:text-[#c4b5fd]" />
            </div>
            <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
              Score moyen (équipe)
            </p>
          </div>
          {home.noteGlobaleTrendPoints != null && home.noteGlobaleTrendPoints !== 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
                home.noteGlobaleTrendPoints > 0
                  ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-100"
                  : "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-100",
              )}
            >
              {home.noteGlobaleTrendPoints > 0 ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              {home.noteGlobaleTrendPoints > 0 ? "+" : ""}
              {home.noteGlobaleTrendPoints} pts /5
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-3xl font-semibold tabular-nums">
          {avgSalesScoreInWindow == null ? "—" : `${avgSalesScoreInWindow}`}
          {avgSalesScoreInWindow != null ? (
            <span className="text-muted-foreground ml-1 text-lg font-medium dark:text-zinc-400">
              / 100
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground mt-1 text-xs dark:text-zinc-400">
          Moyenne SalesScore sur les RDV analysés de l’organisation
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/10 bg-white p-5 text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6C4DFF]/10 dark:bg-[#6C4DFF]/20">
              <Store className="size-4 text-[#6C4DFF] dark:text-[#c4b5fd]" />
            </div>
            <p className="text-muted-foreground truncate text-sm font-medium dark:text-zinc-400">
              Commerciaux actifs
            </p>
          </div>
        </div>
        <p className="mt-4 text-3xl font-semibold tabular-nums">
          {activeCommercialsCount}
        </p>
        <p className="text-muted-foreground mt-1 text-xs dark:text-zinc-400">
          Membres avec au moins un RDV sur la période
        </p>
      </div>
    </div>
  );
}

export function DashboardAdminShell({ admin }: { admin: OrgAdminDashboard }) {
  const { home, teamMembers, scatterMatrixPoints, orgSoncasAverages } = admin;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          KPI équipe (tous les membres)
        </h2>
        <Suspense
          fallback={
            <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
          }
        >
          <DashboardStatsPeriodSelect value={home.statsWindowDays} />
        </Suspense>
      </div>

      <AdminHeroKpiRow admin={admin} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/rendez-vous/nouveau"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 rounded-lg border-[#6C4DFF]/25 bg-[#6C4DFF]/10 px-4 text-[#5a3fd9] hover:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]",
          )}
        >
          Ajouter un RDV
        </Link>
        <Link
          href="/dashboard/analyse"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-10 gap-1 rounded-lg border-0 bg-[#6C4DFF] px-4 text-white hover:bg-[#5a3fd9]",
          )}
        >
          <span className="text-lg leading-none">+</span>
          Analyse globale
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Indicateurs détaillés
        </h2>
        <DashboardKpiCards home={home} showGlobalNote />
      </div>

      <section className="space-y-3">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Équipe par commercial
        </h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Commercial
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    RDV
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase sm:table-cell dark:text-zinc-500">
                    CA est.
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    Gagnés
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase md:table-cell dark:text-zinc-500">
                    Score moy.
                  </th>
                  <th className="text-muted-foreground px-4 py-3.5 text-[11px] font-semibold tracking-wider uppercase dark:text-zinc-500">
                    TUC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {teamMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center dark:text-zinc-500"
                    >
                      Aucun rendez-vous sur la période.
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((row) => (
                    <tr
                      key={row.sellerUserId}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 font-medium text-zinc-950 dark:text-zinc-50">
                        {row.sellerEmail ?? row.sellerUserId.slice(0, 8)}
                      </td>
                      <td className="tabular-nums px-4 py-3.5">{row.nbRdvs}</td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 tabular-nums sm:table-cell dark:text-zinc-400">
                        {eurFormatter.format(row.tamEstimeEur)}
                      </td>
                      <td className="tabular-nums px-4 py-3.5">
                        {row.winRatePercent == null ? "—" : `${row.winRatePercent}%`}
                      </td>
                      <td className="hidden px-4 py-3.5 tabular-nums md:table-cell">
                        {row.avgSalesScore == null ? "—" : row.avgSalesScore}
                      </td>
                      <td className="tabular-nums px-4 py-3.5">
                        {row.tucOptimisePercent == null
                          ? "—"
                          : `${row.tucOptimisePercent}%`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-muted-foreground text-xs dark:text-zinc-500">
          Données agrégées sur la fenêtre sélectionnée (tous les membres de
          l’organisation).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Statistiques globales (organisation)
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Matrice des rendez-vous</CardTitle>
              <CardDescription>
                Échantillon de {scatterMatrixPoints.length} rendez-vous (équipe)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingMatrixScatter points={scatterMatrixPoints} />
            </CardContent>
          </Card>
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Profil SONCAS équipe</CardTitle>
              <CardDescription>
                Moyenne des leviers sur les analyses de la période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrgSoncasRadar averages={orgSoncasAverages} seriesLabel="Équipe" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Recommandations équipe
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Tendances positives</CardTitle>
              <CardDescription>Basé sur les KPI agrégés</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {admin.progressBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Axes d’amélioration</CardTitle>
              <CardDescription>À partir des moyennes SONCAS</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {admin.improvementBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-amber-500"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
