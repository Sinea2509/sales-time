import { MoreHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TeamMemberInviteDialog } from "@/components/organisms/team-member-invite-dialog";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { TeamRankCell } from "@/components/molecules/team-rank-cell";
import { TeamRankingSummary } from "@/components/molecules/team-ranking-summary";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import { prospectInitials } from "@/lib/prospect-initials";
import { SALES_SCORE_LABEL } from "@/lib/sales-score-color";
import { sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { unrankedExplanation } from "@/src/core/domain/team-ranking";
import type {
  OrgAdminMonEquipePage,
  OrgAdminMonEquipeRankedRow,
} from "@/src/core/application/get-org-admin-dashboard";

function monEquipeListHref(
  basePath: string,
  jours: number,
  equipePage: number,
) {
  const q = new URLSearchParams();
  q.set("jours", String(jours));
  if (equipePage > 1) {
    q.set("equipePage", String(equipePage));
  }
  return `${basePath}?${q.toString()}`;
}

function monEquipePersonLines(row: OrgAdminMonEquipeRankedRow) {
  const full = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  if (full) {
    return { primary: full, secondary: row.email, initialsSource: full };
  }
  return { primary: row.email, secondary: null, initialsSource: row.email };
}

export function MonEquipeSection({
  monEquipe,
  statsWindowDays,
  currentUserEmail,
  listBasePath = "/company/equipe",
  showHeading = true,
}: {
  monEquipe: OrgAdminMonEquipePage;
  statsWindowDays: number;
  currentUserEmail: string;
  /** Base path for pagination links (default: dedicated team page). */
  listBasePath?: string;
  showHeading?: boolean;
}) {
  const lastPage = Math.max(
    1,
    Math.ceil(monEquipe.totalCount / monEquipe.pageSize),
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showHeading ? (
          <h2 className={sectionHeadingClass}>Mon équipe</h2>
        ) : null}
        <TeamMemberInviteDialog currentUserEmail={currentUserEmail} />
      </div>
      <TeamRankingSummary
        ranking={monEquipe.ranking}
        totalCount={monEquipe.totalCount}
      />
      <div className="overflow-hidden rounded-2xl border border-zinc-200/10 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                <DataTableHead
                  className="w-24 px-4 py-3.5 dark:text-zinc-400"
                  title={`Rang sur l'équipe entière, et écart à la moyenne des membres classés. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, le score est affiché mais pas le rang.`}
                >
                  Rang
                </DataTableHead>
                <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                  Personne
                </DataTableHead>
                <DataTableHead
                  className="px-4 py-3.5 tabular-nums dark:text-zinc-400"
                  title="Nombre de rendez-vous portant au moins une analyse KISS sur la période. Tous ne sont pas notés : la note vient de l'analyse SONCAS."
                >
                  RDV coachés
                </DataTableHead>
                <DataTableHead
                  className="px-4 py-3.5 tabular-nums dark:text-zinc-400"
                  title="Temps d'appel moyen sur les RDV connectés (durée renseignée)"
                >
                  TAM
                </DataTableHead>
                <DataTableHead
                  className="px-4 py-3.5 tabular-nums dark:text-zinc-400"
                  title="Moyenne SalesScore sur 5 (analyses SONCAS sur la période)"
                >
                  {SALES_SCORE_LABEL}
                </DataTableHead>
                <DataTableHead
                  className="px-4 py-3.5 dark:text-zinc-400"
                  title={`Palier atteint sur l'échelle de 0 à 5. Deux membres peuvent partager un palier sans partager une place. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, la note est affichée mais le palier n'est pas décerné.`}
                >
                  Palier
                </DataTableHead>
                <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                  Posture
                </DataTableHead>
                <DataTableHead className="w-14 px-4 py-3.5 text-right dark:text-zinc-400">
                  Actions
                </DataTableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {monEquipe.rows.length === 0 ? (
                <TableEmptyRow
                  colSpan={8}
                  message="Aucun membre dans cette organisation."
                  size="large"
                />
              ) : (
                monEquipe.rows.map((row) => {
                  const person = monEquipePersonLines(row);
                  return (
                    <tr
                      key={row.userId}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <TeamRankCell
                          ranking={row}
                          scoredMeetings={row.scoredMeetings}
                          minScoredMeetings={
                            monEquipe.ranking.minScoredMeetings
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <Link
                          href={
                            statsWindowDays === 30
                              ? `/company/equipe/${row.userId}`
                              : `/company/equipe/${row.userId}?jours=${statsWindowDays}`
                          }
                          className="group flex min-w-0 items-center gap-3 rounded-lg py-0.5 pr-2 outline-none transition-colors hover:bg-zinc-100/90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-zinc-500/40"
                          aria-label={`Fiche de ${person.primary}`}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {prospectInitials(person.initialsSource)}
                          </span>
                          <div className="min-w-0 text-left">
                            <p className="truncate font-medium text-zinc-950 underline-offset-2 group-hover:underline dark:text-zinc-50">
                              {person.primary}
                            </p>
                            {person.secondary ? (
                              <p className="text-muted-foreground truncate text-xs dark:text-zinc-400">
                                {person.secondary}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {row.coachesCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                        {row.tamMinutesAvg != null ? (
                          formatDurationHoursMinutes(row.tamMinutesAvg)
                        ) : (
                          <span
                            className="text-muted-foreground dark:text-zinc-400"
                            title="Non calculable : aucun rendez-vous connecté avec une durée renseignée sur la période."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3.5 tabular-nums"
                        title={
                          row.scoredMeetings > 0
                            ? `Moyenne des SalesScores de ${row.scoredMeetings} rendez-vous. Un rendez-vous coaché n'est pas toujours noté : le coaching porte sur l'analyse KISS, la note vient de l'analyse SONCAS.`
                            : "Non calculable : aucun rendez-vous noté sur la période."
                        }
                      >
                        <span className="block font-medium text-zinc-950 dark:text-zinc-50">
                          {formatNoteOn5(row.noteGlobaleOn5)}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {row.scoredMeetings > 0
                            ? `sur ${row.scoredMeetings} RDV noté${
                                row.scoredMeetings > 1 ? "s" : ""
                              }`
                            : "aucun RDV noté"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <TeamTierBadge
                          tier={row.tier}
                          unavailableTitle={
                            row.unrankedReason
                              ? unrankedExplanation(
                                  row.unrankedReason,
                                  row.scoredMeetings,
                                  monEquipe.ranking.minScoredMeetings,
                                )
                              : undefined
                          }
                        />
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                        {row.postureLabel ?? (
                          <span
                            className="text-zinc-500 dark:text-zinc-400"
                            title="Non calculable : aucune analyse SONCAS sur la période."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <Link
                          href="/company/settings/equipe"
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "icon-sm",
                            }),
                            "inline-flex",
                          )}
                          aria-label="Paramètres équipe et membres"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {monEquipe.totalCount > monEquipe.pageSize ? (
        <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <span>
            {monEquipe.totalCount} membre
            {monEquipe.totalCount > 1 ? "s" : ""} · page {monEquipe.page} sur{" "}
            {lastPage}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {monEquipe.page > 1 ? (
              <Link
                href={monEquipeListHref(
                  listBasePath,
                  statsWindowDays,
                  monEquipe.page - 1,
                )}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8",
                )}
              >
                Précédent
              </Link>
            ) : null}
            {monEquipe.page < lastPage ? (
              <Link
                href={monEquipeListHref(
                  listBasePath,
                  statsWindowDays,
                  monEquipe.page + 1,
                )}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8",
                )}
              >
                Suivant
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
