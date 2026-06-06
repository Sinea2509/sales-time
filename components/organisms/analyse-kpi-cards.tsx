import { BadgePercent, Clock, LayoutList, Star } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import {
  KpiVsPreviousBadge,
} from "@/components/molecules/trend-pill";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";

function formatNoteOn5(value: number | null): string {
  if (value == null) return "—";
  const text =
    Math.abs(value % 1) < 0.05
      ? String(Math.round(value))
      : String(value).replace(".", ",");
  return `${text}/5`;
}

export function AnalyseKpiCards({
  home,
  isOrgAdmin,
}: {
  home: OrgDashboardHome;
  isOrgAdmin: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        icon={BadgePercent}
        label={
          isOrgAdmin
            ? "TUC optimisé de l'équipe"
            : "TUC optimisé"
        }
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

      <KpiTile
        icon={Clock}
        label="TAM cumulé"
        trend={
          <KpiVsPreviousBadge
            delta={home.tamCumuleTrendPercent}
            mode="up-good"
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
          />
        }
      >
        {home.nbRdvsRenseignes}
      </KpiTile>

      <KpiTile
        icon={Star}
        label="Note globale sur 5"
        trend={
          <KpiVsPreviousBadge
            delta={home.noteGlobaleTrendPercent}
            mode="up-good"
          />
        }
      >
        {formatNoteOn5(home.noteGlobaleOn5)}
      </KpiTile>
    </div>
  );
}
