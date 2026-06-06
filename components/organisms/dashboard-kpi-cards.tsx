import { BadgePercent, Clock, LayoutList } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export function DashboardKpiCards({ home }: { home: OrgDashboardHome }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiTile
        icon={Clock}
        label="TAM"
        trend={
          <KpiVsPreviousBadge
            delta={home.tamTrendPercent}
            mode="neutral"
          />
        }
      >
        {home.avgDurationMin != null
          ? formatDurationHoursMinutes(home.avgDurationMin)
          : "—"}
      </KpiTile>

      <KpiTile
        icon={LayoutList}
        label="Nb de rdvs"
        trend={
          <KpiVsPreviousBadge delta={home.nbRdvsTrendPercent} mode="up-good" />
        }
      >
        {home.nbRdvs}
      </KpiTile>

      <KpiTile
        icon={BadgePercent}
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
