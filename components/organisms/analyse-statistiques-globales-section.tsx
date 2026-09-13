"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { matriceRendezVousLegende } from "@/lib/matrice-rendez-vous-legende";
import {
  AnalysePriorityOpportunitiesTable,
  TOP_OPPORTUNITIES,
  type AnalysePriorityOpportunityRow,
} from "@/components/organisms/analyse-priority-opportunities-table";
import { QualificationPotentialMatrixScatter } from "@/components/organisms/qualification-potential-matrix-scatter";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";

const CHART_HEIGHT = 420;

export function AnalyseStatistiquesGlobalesSection({
  qualificationPotentialPoints,
  priorityOpportunities,
  rdvSurLaPeriode,
  isTeamView = false,
  etapeOrder,
  statsWindowDays,
  disabledStatsDays = [],
}: {
  qualificationPotentialPoints: QualificationPotentialMatrixPoint[];
  priorityOpportunities: AnalysePriorityOpportunityRow[];
  /**
   * Le nombre de rendez-vous de la période, tous confondus.
   *
   * Le nom compte : l'ancien `rdvCount` ne disait pas de quels rendez-vous il
   * parlait, et les deux appelants lui donnaient deux grandeurs différentes.
   * Ce n'est pas le nombre de points de la matrice, qui se déduit des points
   * eux-mêmes.
   */
  rdvSurLaPeriode: number;
  /** Vue manager : couleur par commercial et sélecteur de période sur la matrice. */
  isTeamView?: boolean;
  /** Le vocabulaire d'étapes de l'organisation, qui range les filtres de la matrice. */
  etapeOrder?: readonly string[];
  statsWindowDays?: StatsWindowDays;
  disabledStatsDays?: StatsWindowDays[];
}) {
  const legendeMatrice = matriceRendezVousLegende({
    pointsPlaces: qualificationPotentialPoints.length,
    rdvSurLaPeriode,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <Card className="flex h-full flex-col border-border shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Matrice des rendez-vous
          </CardTitle>
          <CardDescription>
            {isTeamView ? "Vue équipe · " : ""}
            {legendeMatrice}
          </CardDescription>
          {statsWindowDays != null ? (
            <CardAction>
              <DashboardStatsPeriodSelect
                value={statsWindowDays}
                disabledDays={disabledStatsDays}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0 sm:px-4">
          <QualificationPotentialMatrixScatter
            points={qualificationPotentialPoints}
            height={CHART_HEIGHT}
            legendMode={isTeamView ? "seller" : "etape"}
            etapeOrder={etapeOrder}
          />
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col border-border shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Opportunités prioritaires
          </CardTitle>
          {/*
            « Top 10 des rendez-vous » ne disait pas selon quel critère. Deux
            grandeurs sont pourtant lisibles sur chaque ligne, et le lecteur ne
            pouvait pas savoir laquelle commandait le classement ni ce que la
            barre mesurait. La description porte maintenant les deux.
          */}
          <CardDescription>
            Les plus gros montants potentiels de la période, {TOP_OPPORTUNITIES}{" "}
            au maximum. La barre donne le SalesScore du rendez-vous, de 0 à 100.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <AnalysePriorityOpportunitiesTable rows={priorityOpportunities} />
        </CardContent>
      </Card>
    </div>
  );
}
