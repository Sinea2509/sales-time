import { MeetingEtapeBadge } from "@/components/atoms/meeting-etape-badge";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { MeetingActionBadge } from "@/components/molecules/meeting-action-badge";
import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { RendezVousMeetingRowActions } from "@/components/organisms/rendez-vous-meeting-row-actions";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * La liste des rendez-vous d'un commercial, telle que le tableau de bord et
 * « Ma performance » la montrent : le même rendez-vous vu deux fois doit
 * s'écrire de la même façon, colonnes et pastilles comprises.
 *
 * Les largeurs minimales sont des garde-fous, pas la mise en page : elles ne
 * se déclenchent que sur un écran plus étroit que prévu, pour faire défiler
 * plutôt qu'écraser les colonnes. Les colonnes s'allument aux mêmes largeurs
 * que sur /company/rendez-vous.
 */
export function RecentMeetingsTable({
  rows,
  emptyMessage,
  emptyDescription,
}: {
  rows: RecentMeetingListRow[];
  emptyMessage: string;
  emptyDescription?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-border border bg-card shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] text-left text-sm sm:min-w-[500px] md:min-w-[600px] lg:min-w-[720px]">
          <thead>
            <tr className="border-b border-border bg-muted/90 dark:border-zinc-800 dark:bg-zinc-950/80">
              <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                Prospect
              </DataTableHead>
              <DataTableHead className="hidden px-4 py-3.5 text-right md:table-cell dark:text-zinc-400">
                Potentiel
              </DataTableHead>
              <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                <span className="sm:hidden">Date</span>
                <span className="hidden sm:inline">Date du RDV</span>
              </DataTableHead>
              <DataTableHead className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-400">
                État
              </DataTableHead>
              <DataTableHead className="hidden px-4 py-3.5 md:table-cell dark:text-zinc-400">
                Étape
              </DataTableHead>
              <DataTableHead className="hidden px-4 py-3.5 lg:table-cell dark:text-zinc-400">
                SalesScore
              </DataTableHead>
              <DataTableHead className="w-14 px-2 py-3.5 text-right sm:w-20 sm:px-4 dark:text-zinc-400">
                Actions
              </DataTableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-zinc-800">
            {rows.length === 0 ? (
              <TableEmptyRow
                colSpan={7}
                message={emptyMessage}
                description={emptyDescription}
                size="large"
              />
            ) : (
              rows.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-muted/80 dark:hover:bg-zinc-800/50"
                >
                  <td className="w-full max-w-0 min-w-[7.5rem] px-4 py-3.5 align-middle sm:min-w-[10.5rem]">
                    <ProspectIdentityCell
                      displayName={m.prospectName}
                      company={m.prospectCompany}
                    />
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                      <span className="sm:hidden">
                        <MeetingActionBadge
                          meeting={m}
                          href={`/company/rendez-vous/${m.id}`}
                        />
                      </span>
                      <MeetingEtapeBadge
                        meetingType={m.meetingType}
                        pipelineStage={m.pipelineStage}
                      />
                    </div>
                  </td>
                  <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 text-right align-middle tabular-nums md:table-cell dark:text-zinc-400">
                    {formatPotentialEuro(m.potentialAmount)}
                  </td>
                  <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums dark:text-zinc-400">
                    {dateShort.format(new Date(m.meetingAt))}
                  </td>
                  <td className="hidden px-4 py-3.5 align-middle sm:table-cell">
                    <MeetingActionBadge
                      meeting={m}
                      href={`/company/rendez-vous/${m.id}`}
                    />
                  </td>
                  <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                    <MeetingEtapeBadge
                      meetingType={m.meetingType}
                      pipelineStage={m.pipelineStage}
                    />
                  </td>
                  <td className="hidden px-4 py-3.5 align-middle lg:table-cell">
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
                  <td className="px-2 py-3.5 text-right align-middle sm:px-4">
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
  );
}
