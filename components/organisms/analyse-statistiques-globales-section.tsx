"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import {
  AnalysePriorityOpportunitiesTable,
  type AnalysePriorityOpportunityRow,
} from "@/components/organisms/analyse-priority-opportunities-table";
import { QualificationPotentialMatrixScatter } from "@/components/organisms/qualification-potential-matrix-scatter";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";

const CHART_HEIGHT = 420;

export function AnalyseStatistiquesGlobalesSection({
  qualificationPotentialPoints,
  priorityOpportunities,
  rdvCount,
}: {
  qualificationPotentialPoints: QualificationPotentialMatrixPoint[];
  priorityOpportunities: AnalysePriorityOpportunityRow[];
  rdvCount: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <Card className="flex h-full flex-col border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Matrice des rendez-vous
          </CardTitle>
          <CardDescription>
            sur {rdvCount} rdv{rdvCount > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0 sm:px-4">
          <QualificationPotentialMatrixScatter
            points={qualificationPotentialPoints}
            height={CHART_HEIGHT}
          />
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Opportunités prioritaires
          </CardTitle>
          <CardDescription>Top 10 des rendez-vous</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <AnalysePriorityOpportunitiesTable rows={priorityOpportunities} />
        </CardContent>
      </Card>
    </div>
  );
}
