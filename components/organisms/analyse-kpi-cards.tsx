import { BadgePercent, Clock, LayoutList, Star } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatPercentFr } from "@/lib/format-percent-fr";
import { KPI_TAM_HINT, KPI_TUC_HINT } from "@/lib/kpi-hints";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import {
  formatScoreSur100,
  type EchelleDeNote,
} from "@/lib/format-score-sur100";
import { plurielFr } from "@/lib/pluriel-fr";
import { SALES_SCORE_LABEL } from "@/lib/sales-score-color";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import type { DashboardHomeFigures } from "@/src/core/domain/dashboard-home-from-meetings";

const TAM_SANS_DONNEE =
  "Non calculable : aucun rendez-vous renseigné sur la période. Le gain administratif se compte sur les rendez-vous dont la durée est saisie.";

const TUC_SANS_DONNEE =
  "Non calculable : aucun temps de prospection n'est fixé dans les paramètres de l'organisation, et le TUC se calcule par rapport à lui.";

export function AnalyseKpiCards({
  home,
  isOrgAdmin,
  sellerScoped = false,
  echelle = "sur5",
}: {
  home: DashboardHomeFigures;
  isOrgAdmin: boolean;
  sellerScoped?: boolean;
  /**
   * Sur 5 pour le manager, sur 100 pour le commercial qui lit sa propre
   * performance : la note sur 5 lui a été retirée à la revue du 2 septembre.
   */
  echelle?: EchelleDeNote;
}) {
  const tucLabel =
    sellerScoped || !isOrgAdmin ? "TUC optimisé" : "TUC optimisé de l'équipe";
  const trendCommon = {
    statsWindowDays: home.statsWindowDays,
    minSampleCount: MIN_RDV_FOR_STATS,
  };
  const rdvRenseignes = home.nbRdvsRenseignes;
  const rdvNotes = home.noteGlobaleSampleCount;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        icon={BadgePercent}
        label={tucLabel}
        labelTooltip={KPI_TUC_HINT}
        footer={
          home.tucOptimisePercent === null
            ? null
            : `${formatDurationHoursMinutes(home.usefulConversationMinutes)} de conversation sur ${formatDurationHoursMinutes(home.prospectingMinutes)} de prospection visés`
        }
        trend={
          <KpiVsPreviousBadge
            delta={home.tucTrendPoints}
            mode="up-good"
            deltaDisplay="points"
            pointsScaleLabel="points de pourcentage du TUC"
            currentSampleCount={rdvRenseignes}
            {...trendCommon}
          />
        }
      >
        {home.tucOptimisePercent === null ? (
          <span
            className="text-muted-foreground text-2xl dark:text-zinc-400"
            title={TUC_SANS_DONNEE}
          >
            {VALEUR_NON_CALCULABLE}
          </span>
        ) : (
          formatPercentFr(home.tucOptimisePercent)
        )}
      </KpiTile>

      <KpiTile
        icon={Clock}
        label="TAM cumulé"
        labelTooltip={KPI_TAM_HINT}
        footer={
          rdvRenseignes > 0
            ? `${formatDurationHoursMinutes(home.tamMinutesPerRdv)} économisées sur ${rdvRenseignes === 1 ? "le rendez-vous renseigné" : `chacun des ${rdvRenseignes} rendez-vous renseignés`}`
            : null
        }
        trend={
          <KpiVsPreviousBadge
            delta={home.tamCumuleTrendPercent}
            mode="up-good"
            currentSampleCount={rdvRenseignes}
            {...trendCommon}
          />
        }
      >
        {home.tamCumuleMinutes > 0 ? (
          formatDurationHoursMinutes(home.tamCumuleMinutes)
        ) : (
          <span
            className="text-muted-foreground text-2xl dark:text-zinc-400"
            title={TAM_SANS_DONNEE}
          >
            {VALEUR_NON_CALCULABLE}
          </span>
        )}
      </KpiTile>

      <KpiTile
        icon={LayoutList}
        label="Nb de RDV renseignés"
        footer={
          home.nbRdvs > 0
            ? `sur ${home.nbRdvs} ${plurielFr(home.nbRdvs, "rendez-vous tenu", "rendez-vous tenus")} sur la période`
            : "Aucun rendez-vous sur la période sélectionnée."
        }
        trend={
          <KpiVsPreviousBadge
            delta={home.nbRdvsRenseignesTrendPercent}
            mode="up-good"
            currentSampleCount={rdvRenseignes}
            {...trendCommon}
          />
        }
      >
        {rdvRenseignes}
      </KpiTile>

      <KpiTile
        icon={Star}
        label={SALES_SCORE_LABEL}
        footer={
          rdvNotes > 0
            ? `Moyenne de ${rdvNotes} ${plurielFr(rdvNotes, "rendez-vous analysé", "rendez-vous analysés")}`
            : "Aucun rendez-vous analysé sur la période."
        }
        trend={
          // L'écart en points, et non la variation relative : sous une note,
          // un « +12 % » ne se retrouve dans aucun des deux nombres affichés,
          // alors que « +0,2 pt » ou « +4 pts » est exactement leur différence.
          <KpiVsPreviousBadge
            delta={
              echelle === "sur5"
                ? home.noteGlobaleTrendPoints
                : home.salesScoreTrendPoints
            }
            mode="up-good"
            deltaDisplay="points"
            pointsScaleLabel={
              echelle === "sur5"
                ? "points sur l'échelle de 5"
                : "points sur l'échelle de 100"
            }
            currentSampleCount={rdvNotes}
            {...trendCommon}
          />
        }
      >
        {echelle === "sur5"
          ? formatNoteOn5(home.noteGlobaleOn5)
          : formatScoreSur100(home.salesScoreAvg)}
      </KpiTile>
    </div>
  );
}
