import { BadgePercent, Clock, LayoutList } from "lucide-react";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatPercentFr } from "@/lib/format-percent-fr";
import { KPI_TAM_HINT, KPI_TUC_HINT } from "@/lib/kpi-hints";
import { plurielFr } from "@/lib/pluriel-fr";
import { KpiTile } from "@/components/molecules/kpi-tile";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import type { DashboardHomeFigures } from "@/src/core/domain/dashboard-home-from-meetings";

const TAM_SANS_DONNEE =
  "Non calculable : aucun rendez-vous renseigné sur la période. Le gain administratif se compte sur les rendez-vous dont la durée est saisie.";

const TUC_SANS_DONNEE =
  "Non calculable : aucun temps de prospection n'est fixé dans les paramètres de l'organisation, et le TUC se calcule par rapport à lui.";

/**
 * Les trois cartes de tête d'un tableau de bord, celui d'un commercial comme
 * celui d'un manager. Elles ne prennent que des chiffres, sans savoir sur
 * quelle population ils ont été comptés : c'est leur appelant qui en répond.
 *
 * Chaque carte porte trois choses : ce qu'elle mesure, sa valeur, et de quoi
 * cette valeur est faite. Le pied de carte n'est pas décoratif, c'est lui qui
 * rend le chiffre vérifiable : « 5 h 36 » ne se discute pas, « 28 min
 * économisées sur chacun des 12 rendez-vous renseignés » se discute, et un
 * chiffre qu'on peut discuter est un chiffre auquel on peut croire.
 *
 * Quand la valeur manque, la carte écrit « n. c. » et met la raison dans
 * l'infobulle. Un zéro afficherait une performance nulle là où il n'y a
 * simplement rien eu à mesurer.
 */
export function DashboardKpiCards({ home }: { home: DashboardHomeFigures }) {
  const trendCommon = {
    statsWindowDays: home.statsWindowDays,
    minSampleCount: MIN_RDV_FOR_STATS,
  };
  const rdvRenseignes = home.nbRdvsRenseignes;
  const tamBase = `${formatDurationHoursMinutes(home.tamMinutesPerRdv)} économisées sur ${rdvRenseignes === 1 ? "le rendez-vous renseigné" : `chacun des ${rdvRenseignes} rendez-vous renseignés`}`;

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      data-feedback-id="dashboard-kpi-cards"
    >
      <KpiTile
        icon={Clock}
        label="TAM cumulé"
        labelTooltip={KPI_TAM_HINT}
        footer={rdvRenseignes > 0 ? tamBase : null}
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
        label="Nb de RDV"
        footer={
          home.nbRdvs > 0
            ? `dont ${rdvRenseignes} ${plurielFr(rdvRenseignes, "renseigné")} avec leur durée`
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
        {home.nbRdvs}
      </KpiTile>

      <KpiTile
        icon={BadgePercent}
        label="TUC optimisé"
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
    </div>
  );
}
