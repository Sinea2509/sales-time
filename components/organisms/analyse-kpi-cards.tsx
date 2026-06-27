import { BadgePercent, Clock, LayoutList, Star } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KPI_TAM_HINT, KPI_TUC_HINT } from "@/lib/kpi-hints";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import { SALES_SCORE_LABEL } from "@/lib/sales-score-color";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

export function AnalyseKpiCards({
  home,
  isOrgAdmin,
  sellerScoped = false,
}: {
  home: OrgDashboardHome;
  isOrgAdmin: boolean;
  sellerScoped?: boolean;
}) {
  const tucLabel =
    sellerScoped || !isOrgAdmin ? "TUC optimisé" : "TUC optimisé de l'équipe";
  const trendCommon = {
    statsWindowDays: home.statsWindowDays,
    minSampleCount: MIN_RDV_FOR_STATS,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        icon={BadgePercent}
        label={tucLabel}
        labelTooltip={KPI_TUC_HINT}
        trend={
          <KpiVsPreviousBadge
            delta={home.tucTrendPoints}
            mode="up-good"
            deltaDisplay="percentagePoints"
            currentSampleCount={home.nbRdvsRenseignes}
            {...trendCommon}
          />
        }
      >
        {home.tucOptimisePercent === null ? "—" : `${home.tucOptimisePercent}%`}
      </KpiTile>

      <KpiTile
        icon={Clock}
        label="TAM cumulé"
        labelTooltip={KPI_TAM_HINT}
        trend={
          <KpiVsPreviousBadge
            delta={home.tamCumuleTrendPercent}
            mode="up-good"
            currentSampleCount={home.nbRdvsRenseignes}
            {...trendCommon}
          />
        }
      >
        {home.tamCumuleMinutes > 0
          ? formatDurationHoursMinutes(home.tamCumuleMinutes)
          : "—"}
      </KpiTile>

      <KpiTile
        icon={LayoutList}
        label="Nb de rdvs renseignés"
        trend={
          <KpiVsPreviousBadge
            delta={home.nbRdvsRenseignesTrendPercent}
            mode="up-good"
            currentSampleCount={home.nbRdvsRenseignes}
            {...trendCommon}
          />
        }
      >
        {home.nbRdvsRenseignes}
      </KpiTile>

      <KpiTile
        icon={Star}
        label={SALES_SCORE_LABEL}
        footer="Moyenne sur 5"
        trend={
          <KpiVsPreviousBadge
            delta={home.noteGlobaleTrendPercent}
            mode="up-good"
            currentSampleCount={home.noteGlobaleSampleCount}
            {...trendCommon}
          />
        }
      >
        {formatNoteOn5(home.noteGlobaleOn5)}
      </KpiTile>
    </div>
  );
}
