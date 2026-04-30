import { Suspense } from "react";
import { Banknote, Store, TrendingUp } from "lucide-react";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { KpiTile } from "@/components/molecules/kpi-tile";
import {
  TrendPercentPill,
  TrendPointsPill,
} from "@/components/molecules/trend-pill";
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
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/src/core/domain/dashboard-estimates";
import type { OrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function AdminHeroKpiRow({ admin }: { admin: OrgAdminDashboard }) {
  const { home, avgSalesScoreInWindow, activeCommercialsCount, kpis } = admin;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiTile
        icon={Banknote}
        label="CA estimé (équipe)"
        trend={
          <TrendPercentPill
            percent={home.tamTrendPercent}
            mode="up-good"
            surface="admin"
          />
        }
        footer={
          <>
            {eurFormatter.format(ESTIMATED_TAM_EUR_PER_RDV)} / RDV ·{" "}
            {home.statsWindowDays} jours · Taux de gain{" "}
            {kpis.winRatePercent == null ? "—" : `${kpis.winRatePercent}%`}
          </>
        }
      >
        {eurFormatter.format(home.tamCumuleEur)}
      </KpiTile>

      <KpiTile
        icon={TrendingUp}
        label="Score moyen (équipe)"
        trend={
          home.noteGlobaleTrendPoints != null &&
          home.noteGlobaleTrendPoints !== 0 ? (
            <TrendPointsPill
              points={home.noteGlobaleTrendPoints}
              suffix="pts /5"
              surface="admin"
            />
          ) : null
        }
        footer="Moyenne SalesScore sur les RDV analysés de l’organisation"
      >
        {avgSalesScoreInWindow == null ? "—" : `${avgSalesScoreInWindow}`}
        {avgSalesScoreInWindow != null ? (
          <span className="text-muted-foreground ml-1 text-lg font-medium dark:text-zinc-400">
            / 100
          </span>
        ) : null}
      </KpiTile>

      <KpiTile icon={Store} label="Commerciaux actifs" footer="Membres avec au moins un RDV sur la période">
        {activeCommercialsCount}
      </KpiTile>
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
        <BrandCtaLink
          href="/company/rendez-vous/nouveau"
          variant="outline"
          className="h-10 rounded-lg"
        >
          Ajouter un RDV
        </BrandCtaLink>
        <BrandCtaLink
          href="/company/analyse"
          variant="primary"
          className="h-10 gap-1 rounded-lg"
        >
          <span className="text-lg leading-none">+</span>
          Analyse globale
        </BrandCtaLink>
      </div>

      <div className="space-y-3">
        <h2 className="text-foreground text-lg font-medium tracking-tight">
          Indicateurs détaillés
        </h2>
        <DashboardKpiCards home={home} />
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
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Commercial
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    RDV
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-500">
                    CA est.
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    Gagnés
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 md:table-cell dark:text-zinc-500">
                    Score moy.
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-500">
                    TUC
                  </DataTableHead>
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
