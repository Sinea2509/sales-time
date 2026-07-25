import { Suspense } from "react";
import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { RendezVousMeetingRowActions } from "@/components/organisms/rendez-vous-meeting-row-actions";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { DashboardStandingCard } from "@/components/organisms/dashboard-standing-card";
import { MeetingCreateDialog } from "@/components/organisms/meeting-create-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import {
  meetingEtapeDisplayLabel,
  meetingEtapePillClass,
} from "@/lib/meeting-etape-pill";
import { sectionHeadingClass } from "@/lib/page-typography";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type { TeamMemberStanding } from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Écrit un potentiel en euros, ou « n. c. » quand il n'est pas renseigné.
 * Un tiret seul dans une colonne de montants se lit comme un zéro, ou comme un
 * signe moins tronqué : il faut dire que la donnée manque, pas la maquiller.
 */
function formatPotentialEuro(amount: number | null): string {
  if (amount == null) return VALEUR_NON_CALCULABLE;
  return euroFormat.format(amount);
}

export function DashboardHomeShell({
  home,
  standing = null,
  meetingTypeOptions,
  pipelineStageOptions,
  disabledStatsDays = [],
}: {
  home: OrgDashboardHome;
  /** Place du commercial dans son équipe. `null` hors organisation ou hors équipe. */
  standing?: TeamMemberStanding | null;
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
  disabledStatsDays?: StatsWindowDays[];
}) {
  return (
    <div className="space-y-8" data-feedback-id="dashboard-home">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Mes KPI opérationnels</h2>
          <Suspense
            fallback={
              <Skeleton className="h-9 w-36 shrink-0 self-start rounded-md sm:self-auto" />
            }
          >
            <DashboardStatsPeriodSelect
              value={home.statsWindowDays}
              disabledDays={disabledStatsDays}
            />
          </Suspense>
        </div>

        {/*
          La position vient avant les KPI opérationnels, et non après : c'est la
          seule ligne de l'écran qui réponde à « où j'en suis », les autres
          répondant à « ce que j'ai fait ». Elle dépend de la même période que
          les cartes, d'où sa place sous le sélecteur qui la commande.
        */}
        {standing ? <DashboardStandingCard standing={standing} /> : null}

        <DashboardKpiCards home={home} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <MeetingCreateDialog
          meetingTypeOptions={meetingTypeOptions}
          pipelineStageOptions={pipelineStageOptions}
          showPlusIcon={false}
          dataFeedbackId="dashboard-prepare-rdv"
          className="h-10 rounded-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_2px_8px_rgba(108,77,255,0.35)]"
        />
      </div>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Mes rendez-vous</h2>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                    Prospect
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-400">
                    Potentiel
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-400">
                    TAM
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                    Date du RDV
                  </DataTableHead>
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                    Étape
                  </DataTableHead>
                  <DataTableHead className="hidden px-4 py-3.5 md:table-cell dark:text-zinc-400">
                    SalesScore
                  </DataTableHead>
                  <DataTableHead className="w-20 px-4 py-3.5 text-right dark:text-zinc-400">
                    Actions
                  </DataTableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {home.recentMeetings.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    message="Aucun rendez-vous."
                    size="large"
                  />
                ) : (
                  home.recentMeetings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <ProspectIdentityCell
                          displayName={m.prospectName}
                          company={m.prospectCompany}
                        />
                      </td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums sm:table-cell dark:text-zinc-400">
                        {formatPotentialEuro(m.potentialAmount)}
                      </td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 align-middle tabular-nums sm:table-cell dark:text-zinc-400">
                        {formatDurationHoursMinutes(home.tamMinutesPerRdv)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums dark:text-zinc-400">
                        {dateShort.format(new Date(m.meetingAt))}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meetingEtapePillClass({
                              meetingType: m.meetingType,
                              pipelineStage: m.pipelineStage,
                            }),
                          )}
                        >
                          {meetingEtapeDisplayLabel({
                            meetingType: m.meetingType,
                            pipelineStage: m.pipelineStage,
                          })}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                        {m.salesScore != null ? (
                          <span
                            className={cn(
                              "text-base font-semibold tabular-nums",
                              salesScoreColorClass(m.salesScore),
                            )}
                          >
                            {m.salesScore}
                          </span>
                        ) : (
                          <span
                            className="text-muted-foreground dark:text-zinc-400"
                            title="Non calculable : ce rendez-vous n'a pas encore d'analyse SONCAS."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <RendezVousMeetingRowActions
                          meetingId={m.id}
                          prospectName={m.prospectName}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
