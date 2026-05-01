import { Box, Clock, Wallet } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export function DashboardKpiCards({ home }: { home: OrgDashboardHome }) {
  const heroIsDuration = home.avgDurationMin != null;
  const heroTrend = heroIsDuration
    ? home.avgDurationTrendPercent
    : home.tamTrendPercent;
  const heroTrendMode: "up-good" | "down-good" = heroIsDuration
    ? "down-good"
    : "up-good";

  const HeroIcon = Clock;
  const heroLabel = heroIsDuration ? "Temps moyen RDV" : "TAM cumulé";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiTile
        icon={HeroIcon}
        label={heroLabel}
        trend={
          <KpiVsPreviousBadge delta={heroTrend} mode={heroTrendMode} />
        }
        footer={
          heroIsDuration ? (
            <>
              TAM cumulé :{" "}
              <span className="text-foreground font-medium">
                {formatDurationHoursMinutes(home.tamCumuleMinutes)}
              </span>
            </>
          ) : undefined
        }
      >
        {heroIsDuration
          ? formatDurationHoursMinutes(home.avgDurationMin!)
          : formatDurationHoursMinutes(home.tamCumuleMinutes)}
      </KpiTile>

      <KpiTile
        icon={Box}
        label="Nb de rdvs"
        trend={
          <KpiVsPreviousBadge delta={home.nbRdvsTrendPercent} mode="up-good" />
        }
      >
        {home.nbRdvs}
      </KpiTile>

      <KpiTile
        icon={Wallet}
        label="TUC optimisé (%)"
        trend={
          <KpiVsPreviousBadge
            delta={home.tucTrendPoints}
            mode="up-good"
            deltaDisplay="percentagePoints"
          />
        }
      >
        {home.tucOptimisePercent === null ? "—" : `${home.tucOptimisePercent}%`}
      </KpiTile>
    </div>
  );
}
