import { Banknote, Box, Clock, Wallet } from "lucide-react";
import { ESTIMATED_TAM_EUR_PER_RDV } from "@/src/core/domain/dashboard-estimates";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import {
  TrendPercentPill,
  TrendPointsPill,
} from "@/components/molecules/trend-pill";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function DashboardKpiCards({ home }: { home: OrgDashboardHome }) {
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiTile
        icon={HeroIcon}
        label={heroLabel}
        trend={
          <TrendPercentPill percent={heroTrend} mode={heroTrendMode} />
        }
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
      </KpiTile>

      <KpiTile
        icon={Box}
        label="Nb de rdvs"
        trend={
          <TrendPercentPill percent={home.nbRdvsTrendPercent} mode="up-good" />
        }
      >
        {home.nbRdvs}
      </KpiTile>

      <KpiTile
        icon={Wallet}
        label="TUC optimisé"
        trend={<TrendPointsPill points={home.tucTrendPoints} />}
      >
        {home.tucOptimisePercent === null ? "—" : `${home.tucOptimisePercent}%`}
      </KpiTile>
    </div>
  );
}
