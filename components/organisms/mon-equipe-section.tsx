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
  /**
   * Titre porté par la section elle-même.
   *
   * Vrai quand la section vit au milieu d'autres sections et a besoin de se
   * nommer. Faux quand la page porte déjà ce titre en tête : deux « Mon équipe »
   * l'un sous l'autre, à deux tailles différentes, se lisent comme un doublon.
   */
  showHeading?: boolean;
}) {
  const lastPage = Math.max(
    1,
    Math.ceil(monEquipe.totalCount / monEquipe.pageSize),
  );

  return (
    <section className="space-y-3">
      {/*
        Sans titre, le bouton reste seul sur sa ligne : il se range à droite,
        là où il se trouve déjà quand le titre l'accompagne, plutôt que de
        sauter à gauche d'un écran à l'autre.
      */}
      <div
        className={
          showHeading
            ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
        }
      >
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
        {/*
          Les colonnes s'effacent par ordre inverse d'importance quand l'écran
          rétrécit, exactement comme le tableau du tableau de bord commercial le
          fait déjà. Sur téléphone il reste la place, la personne et la note :
          les trois réponses que le manager vient chercher. Le reste se retrouve
          d'une tape sur la fiche, qui l'écrit en toutes lettres. Sans ce
          découpage, huit colonnes tenues à 880px se réduisaient à un défilement
          horizontal muet où l'on ne voyait que le nom, coupé net.
        */}
        <div className="overflow-x-auto">
          {/*
            Ces largeurs minimales sont des garde-fous, pas la mise en page :
            elles sont réglées sous ce que le contenu réclame à chaque palier,
            si bien qu'elles ne se déclenchent que sur un écran plus étroit que
            prévu, pour faire défiler plutôt qu'écraser les colonnes.
          */}
          <table className="w-full min-w-[300px] text-left text-sm sm:min-w-[480px] md:min-w-[560px] lg:min-w-[760px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                <DataTableHead
                  className="w-16 px-4 py-3.5 sm:w-24 dark:text-zinc-400"
                  title={`Rang sur l'équipe entière, et écart à la moyenne des membres classés. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, le score est affiché mais pas le rang.`}
                >
                  Rang
                </DataTableHead>
                <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                  Personne
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 tabular-nums md:table-cell dark:text-zinc-400"
                  title="Nombre de rendez-vous portant au moins une analyse KISS sur la période. Tous ne sont pas notés : la note vient de l'analyse SONCAS."
                >
                  RDV coachés
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 tabular-nums lg:table-cell dark:text-zinc-400"
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
                  className="hidden px-4 py-3.5 sm:table-cell dark:text-zinc-400"
                  title={`Palier atteint sur l'échelle de 0 à 5. Deux membres peuvent partager un palier sans partager une place. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, la note est affichée mais le palier n'est pas décerné.`}
                >
                  Palier
                </DataTableHead>
                <DataTableHead className="hidden px-4 py-3.5 lg:table-cell dark:text-zinc-400">
                  Posture
                </DataTableHead>
                <DataTableHead className="hidden w-14 px-4 py-3.5 text-right lg:table-cell dark:text-zinc-400">
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
                      {/*
                        « w-full max-w-0 » fait de cette colonne la colonne
                        élastique : elle prend la place que les autres laissent
                        et coupe proprement, au lieu d'imposer la largeur du
                        plus long nom à tout le tableau. La largeur minimale est
                        ce qui empêche l'élasticité de se retourner contre elle :
                        sans elle, les colonnes à contenu insécable se servent
                        d'abord et le nom tombe à « C… ».
                      */}
                      <td className="w-full max-w-0 min-w-[7.5rem] px-4 py-3.5 align-middle sm:min-w-[10.5rem]">
                        <Link
                          href={
                            statsWindowDays === 30
                              ? `/company/equipe/${row.userId}`
                              : `/company/equipe/${row.userId}?jours=${statsWindowDays}`
                          }
                          className="group flex min-w-0 items-center gap-3 rounded-lg py-0.5 pr-2 outline-none transition-colors hover:bg-zinc-100/90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-zinc-500/40"
                          aria-label={`Fiche de ${person.primary}`}
                        >
                          {/*
                            La pastille d'initiales redit en deux lettres le nom
                            écrit juste à côté. Sur téléphone elle coûte 48px de
                            largeur pour cela : le nom entier les vaut mieux.
                          */}
                          <span
                            className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 sm:flex dark:bg-zinc-800 dark:text-zinc-200"
                            aria-hidden
                          >
                            {prospectInitials(person.initialsSource)}
                          </span>
                          <div className="min-w-0 text-left">
                            {/*
                              Sur téléphone le nom passe à la ligne au lieu
                              d'être coupé : la hauteur ne coûte rien sur un
                              écran qui défile déjà, la largeur coûte tout. À
                              partir de « sm », la place existe et la coupure
                              propre redevient préférable au retour à la ligne,
                              qui déformerait la hauteur des lignes du tableau.
                            */}
                            <p className="font-medium text-zinc-950 underline-offset-2 group-hover:underline sm:truncate dark:text-zinc-50">
                              {person.primary}
                            </p>
                            {person.secondary ? (
                              // L'adresse e-mail ne sert qu'à départager deux
                              // homonymes : sur téléphone elle coûte plus de
                              // largeur qu'elle n'en rend, et la fiche l'affiche.
                              <p className="text-muted-foreground hidden truncate text-xs sm:block dark:text-zinc-400">
                                {person.secondary}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3.5 tabular-nums md:table-cell">
                        {row.coachesCount}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3.5 tabular-nums lg:table-cell">
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
                        // Pas de « whitespace-nowrap » ici : le suffixe
                        // « moyenne de 8 RDV notés » revient à la ligne quand la
                        // place manque plutôt que d'imposer sa largeur à toute
                        // la colonne. La note doit rester lisible sans faire
                        // défiler ; la phrase qui la justifie peut tenir sur
                        // deux lignes, la ligne du nom en fait déjà autant.
                        // Sauf sur téléphone, où c'est le nom qui gagne : voir
                        // le commentaire de la ligne de base, plus bas.
                        className="px-4 py-3.5 tabular-nums"
                        title={
                          row.scoredMeetings > 0
                            ? `Moyenne des SalesScores de ${row.scoredMeetings} rendez-vous. Un rendez-vous coaché n'est pas toujours noté : le coaching porte sur l'analyse KISS, la note vient de l'analyse SONCAS.`
                            : "Non calculable : aucun rendez-vous noté sur la période."
                        }
                      >
                        <span className="block font-medium text-zinc-950 dark:text-zinc-50">
                          {formatNoteOn5(row.noteGlobaleOn5)}
                        </span>
                        {/*
                          « moyenne de 6 RDV notés » et non « sur 6 RDV notés » :
                          la fiche du commercial écrit « 3e place sur 7 » deux
                          lignes plus loin, où « sur » veut dire « parmi ». Les
                          deux écrans emploient donc la même formulation, qui ne
                          se lit que d'une seule façon.
                        */}
                        {/*
                          Sur téléphone, la base s'efface quand il y a une note :
                          « 4,3/5 » se lit seul, et les deux lignes que la base
                          lui coûtait reviennent au nom, qui était coupé net.
                          Elle reste affichée quand il n'y a pas de note, parce
                          que « n. c. » ne se lit pas seul et que l'infobulle qui
                          l'explique n'existe pas sous le doigt.
                        */}
                        <span
                          className={
                            row.scoredMeetings > 0
                              ? "hidden text-xs text-zinc-500 sm:block dark:text-zinc-400"
                              : "block text-xs text-zinc-500 dark:text-zinc-400"
                          }
                        >
                          {row.scoredMeetings > 0
                            ? `moyenne de ${row.scoredMeetings} RDV noté${
                                row.scoredMeetings > 1 ? "s" : ""
                              }`
                            : "aucun RDV noté"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 sm:table-cell">
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
                      <td className="hidden max-w-[10rem] truncate px-4 py-3.5 text-zinc-700 lg:table-cell dark:text-zinc-300">
                        {row.postureLabel ?? (
                          <span
                            className="text-zinc-500 dark:text-zinc-400"
                            title="Non calculable : aucune analyse SONCAS sur la période."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3.5 text-right align-middle lg:table-cell">
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
