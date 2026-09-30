import { BadgePercent, Clock, Euro, Gauge, LayoutList } from "lucide-react";
import { Sparkline } from "@/components/molecules/sparkline";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatPercentFr } from "@/lib/format-percent-fr";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { KPI_TAM_HINT, KPI_TUC_HINT } from "@/lib/kpi-hints";
import { plurielFr } from "@/lib/pluriel-fr";
import { statsWindowLabel } from "@/lib/stats-window-labels";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import type { DashboardHomeFigures } from "@/src/core/domain/dashboard-home-from-meetings";
import type { PipelineInProgress } from "@/src/core/domain/pipeline-in-progress";

const TAM_SANS_DONNEE =
  "Non calculable : aucun rendez-vous renseigné sur la période. Le gain administratif se compte sur les rendez-vous dont la durée est saisie.";

const TUC_SANS_DONNEE =
  "Non calculable : aucun temps de prospection n'est fixé dans les paramètres de l'organisation, et le taux d'utilisation se calcule par rapport à lui.";

const SALES_SCORE_HINT =
  "Moyenne des SalesScores des rendez-vous analysés de l'équipe sur la période. Le trait montre son évolution, rendez-vous après rendez-vous.";

/**
 * Les quatre tuiles de tête d'un tableau de bord, comme la maquette du 11
 * septembre les pose : rendez-vous analysés, temps administratif gagné, puis
 * le taux d'utilisation pour un commercial ou le SalesScore d'équipe pour un
 * manager, et enfin le potentiel des affaires en cours.
 *
 * Chaque tuile porte ce qu'elle mesure, sa valeur, et de quoi cette valeur
 * est faite. Quand la valeur manque, la tuile écrit « n. c. » et met la
 * raison dans l'infobulle : un zéro afficherait une performance nulle là où
 * il n'y a simplement rien eu à mesurer.
 */
export function DashboardKpiCards({
  home,
  audience = "seller",
  pipeline = null,
  scoreSeries = [],
  sellersCount = null,
}: {
  home: DashboardHomeFigures;
  audience?: "seller" | "team";
  /** Les affaires ouvertes et leur potentiel. Absent : la tuile n'est pas montrée. */
  pipeline?: PipelineInProgress | null;
  /** La courbe du SalesScore d'équipe, pour le manager. */
  scoreSeries?: readonly number[];
  /** Effectif de l'équipe, pour le pied du temps administratif du manager. */
  sellersCount?: number | null;
}) {
  const trendCommon = {
    statsWindowDays: home.statsWindowDays,
    minSampleCount: MIN_RDV_FOR_STATS,
  };
  const rdvRenseignes = home.nbRdvsRenseignes;
  const analyzed = home.noteGlobaleSampleCount;
  const periode = statsWindowLabel(home.statsWindowDays);

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-feedback-id="dashboard-kpi-cards"
    >
      <KpiTile
        icon={LayoutList}
        label="Rendez-vous analysés"
        footer={
          home.nbRdvs > 0
            ? `sur ${home.nbRdvs} rendez-vous des ${periode}`
            : "Aucun rendez-vous sur la période sélectionnée."
        }
        trend={
          <KpiVsPreviousBadge
            delta={home.nbRdvsTrendPercent}
            mode="up-good"
            currentSampleCount={home.nbRdvs}
            {...trendCommon}
          />
        }
      >
        {analyzed}
      </KpiTile>

      {audience === "team" ? (
        <KpiTile
          icon={Gauge}
          label="SalesScore équipe, sur 100"
          labelTooltip={SALES_SCORE_HINT}
          footer={
            home.salesScoreTrendPoints == null
              ? "première période mesurée"
              : home.salesScoreTrendPoints === 0
                ? "stable par rapport à la période précédente"
                : null
          }
          trend={
            <span className="flex items-center gap-3">
              <Sparkline values={scoreSeries} label="SalesScore équipe" />
              <KpiVsPreviousBadge
                delta={home.salesScoreTrendPoints}
                mode="up-good"
                deltaDisplay="points"
                pointsScaleLabel="points de SalesScore sur 100"
                currentSampleCount={analyzed}
                {...trendCommon}
              />
            </span>
          }
        >
          {home.salesScoreAvg ?? (
            <span
              className="text-muted-foreground text-2xl dark:text-zinc-400"
              title="Non calculable : aucun rendez-vous analysé sur la période."
            >
              {VALEUR_NON_CALCULABLE}
            </span>
          )}
        </KpiTile>
      ) : null}

      <KpiTile
        icon={Clock}
        label="Temps administratif gagné"
        labelTooltip={KPI_TAM_HINT}
        footer={
          rdvRenseignes > 0
            ? audience === "team" && sellersCount != null
              ? `pour ${sellersCount} ${plurielFr(sellersCount, "commercial", "commerciaux")}, sur les ${periode}`
              : `${formatDurationHoursMinutes(home.tamMinutesPerRdv)} économisées sur ${rdvRenseignes === 1 ? "le rendez-vous renseigné" : `chacun des ${rdvRenseignes} rendez-vous renseignés`}`
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

      {audience === "seller" ? (
        <KpiTile
          icon={BadgePercent}
          label="Votre taux d'utilisation"
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
              pointsScaleLabel="points de pourcentage du taux d'utilisation"
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
      ) : null}

      {pipeline ? (
        <KpiTile
          icon={Euro}
          label={
            audience === "team" ? "Pipeline en cours" : "Potentiel en cours"
          }
          footer={
            pipeline.activeDeals > 0
              ? `${pipeline.activeDeals} ${plurielFr(pipeline.activeDeals, "affaire active", "affaires actives")}${pipeline.valuedDeals < pipeline.activeDeals ? `, ${pipeline.activeDeals - pipeline.valuedDeals} sans potentiel renseigné` : ""}`
              : "Aucune affaire ouverte sur la période."
          }
        >
          {pipeline.valuedDeals > 0 ? (
            formatPotentialEuro(pipeline.totalEuro)
          ) : (
            <span
              className="text-muted-foreground text-2xl dark:text-zinc-400"
              title="Non calculable : aucun potentiel renseigné sur les affaires ouvertes."
            >
              {VALEUR_NON_CALCULABLE}
            </span>
          )}
        </KpiTile>
      ) : null}
    </div>
  );
}
