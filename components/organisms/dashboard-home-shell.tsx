import { Suspense } from "react";
import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { MeetingEtapeBadge } from "@/components/atoms/meeting-etape-badge";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { RendezVousMeetingRowActions } from "@/components/organisms/rendez-vous-meeting-row-actions";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { MeetingActionBadge } from "@/components/molecules/meeting-action-badge";
import { CommercialActionPlan } from "@/components/organisms/commercial-action-plan";
import { CommercialDashboardHero } from "@/components/organisms/commercial-dashboard-hero";
import { CommercialMonthFocusCards } from "@/components/organisms/commercial-month-focus-cards";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MeetingCreateDialog } from "@/components/organisms/meeting-create-dialog";
import { meetingsTodoSummary } from "@/src/core/domain/meeting-next-action";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { sectionHeadingClass } from "@/lib/page-typography";
import { sousTitreDuGroupe } from "@/components/organisms/dashboard-standing-card";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type { TeamMemberStanding } from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { CoachingAction } from "@/src/core/domain/seller-action-plan";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DashboardHomeShell({
  home,
  standing = null,
  comparisonGroup = "team",
  managerNameLine = null,
  coachingActions = [],
  meetingTypeOptions,
  pipelineStageOptions,
  disabledStatsDays = [],
}: {
  home: OrgDashboardHome;
  /** Place du commercial dans son équipe. `null` hors organisation ou hors équipe. */
  standing?: TeamMemberStanding | null;
  /** Groupe sur lequel le rang a été calculé, tel que `teamScopeGroup` le nomme. */
  comparisonGroup?: TeamScopeGroup;
  /** Nom du manager qui donne son périmètre au rang. `null` s'il n'y en a pas. */
  managerNameLine?: string | null;
  /** Les gestes de la semaine, tirés du coaching KISS. Vide sans rendez-vous analysé. */
  coachingActions?: CoachingAction[];
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
  disabledStatsDays?: StatsWindowDays[];
}) {
  return (
    <div className="space-y-8" data-feedback-id="dashboard-home">
      {/*
        L'écran s'ouvre sur « où j'en suis » : la position et le focus, les deux
        lignes qui répondent à cette question, avant les indicateurs qui disent
        « ce que j'ai fait ». Le focus est le même signal que la carte « à
        coacher » du manager, sur la même personne : le commercial voit enfin ce
        qu'on lit de lui. Le sélecteur de période coiffe ce bloc, car tout ce qui
        suit en dépend.

        Sans place, ce bloc n'a rien à dire et disparaît : le sélecteur passe
        alors sur les indicateurs, seul écran qui reste, pour ne pas se retrouver
        sans point d'ancrage.
      */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Où j&apos;en suis</h2>
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
        <CommercialDashboardHero
          salesScoreAvg={home.salesScoreAvg}
          scoredMeetings={home.noteGlobaleSampleCount}
          statsWindowDays={home.statsWindowDays}
          trendPoints={home.salesScoreTrendPoints}
          rank={
            standing?.row?.rank != null && standing.ranking.rankedCount > 1
              ? {
                  rank: standing.row.rank,
                  rankedCount: standing.ranking.rankedCount,
                }
              : null
          }
          challenge={home.sellerFocus?.challenge ?? null}
        />
        {managerNameLine && standing?.row?.rank != null ? (
          <p className="text-muted-foreground text-xs">
            {sousTitreDuGroupe(comparisonGroup, managerNameLine).texte}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Mes indicateurs de la période</h2>
        <DashboardKpiCards
          home={home}
          audience="seller"
          pipeline={home.sellerFocus?.pipeline ?? null}
        />
      </section>

      {home.sellerFocus ? (
        <CommercialMonthFocusCards
          axis={home.sellerFocus.axis}
          strengths={home.sellerFocus.strengths}
          profileHref="/company/analyse"
        />
      ) : null}

      {/*
        Le plan d'action se pose entre les chiffres et la liste : « voilà où
        j'en suis, voilà quoi faire cette semaine, voilà mes rendez-vous ». Ses
        gestes viennent du même coaching KISS que sa fiche, resserrés aux deux
        ou trois à prendre en premier. Il ne s'affiche que dans une organisation
        et pour un commercial dont on connaît la place : le même contexte que le
        focus au-dessus, faute de quoi il n'aurait aucun coaching à réduire.
      */}
      {standing ? (
        <CommercialActionPlan
          actions={coachingActions}
          coachingHref="/company/analyse"
        />
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={sectionHeadingClass}>Mes derniers rendez-vous</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Cliquez une ligne pour ouvrir le compte rendu et l&apos;analyse.
            </p>
          </div>
          {/*
            L'action d'analyse vit dans l'en-tête des rendez-vous, là où on la
            cherche : elle nourrit ce tableau et toute la page. Elle flottait
            avant seule sur une ligne, entre la position et la liste, sans dire
            à quoi elle se rattachait.
          */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/company/rendez-vous"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10",
              )}
            >
              Tout voir
            </Link>
            <MeetingCreateDialog
              meetingTypeOptions={meetingTypeOptions}
              pipelineStageOptions={pipelineStageOptions}
              showPlusIcon={false}
              dataFeedbackId="dashboard-prepare-rdv"
              className="h-10 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_2px_8px_rgba(108,77,255,0.35)]"
            />
          </div>
        </div>

        {/*
          Ce que la liste attend du commercial, compté d'un coup, avant de la
          lire ligne à ligne. Deux nombres, ceux qui appellent un geste : à
          analyser, à relancer. Portés sur les rendez-vous affichés ; une fois
          tout à jour, la barre le dit plutôt que de disparaître, pour qu'un
          écran sans rien à faire se lise comme une bonne nouvelle et non comme
          un oubli.
        */}
        {home.recentMeetings.length > 0
          ? (() => {
              const todo = meetingsTodoSummary(home.recentMeetings);
              const puce =
                "inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
              return todo.aAnalyser > 0 || todo.aRelancer > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground dark:text-zinc-400">
                    À faire :
                  </span>
                  {todo.aAnalyser > 0 ? (
                    <span className={puce}>{todo.aAnalyser} à analyser</span>
                  ) : null}
                  {todo.aRelancer > 0 ? (
                    <span className={puce}>{todo.aRelancer} à relancer</span>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground dark:text-zinc-400">
                  Ces rendez-vous sont à jour : rien à analyser ni à relancer.
                </p>
              );
            })()
          : null}

        <div className="overflow-hidden rounded-2xl border-border border bg-card shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            {/*
              Ces largeurs minimales sont des garde-fous, pas la mise en page :
              elles sont réglées sous ce que le contenu réclame à chaque palier,
              si bien qu'elles ne se déclenchent que sur un écran plus étroit
              que prévu, pour faire défiler plutôt qu'écraser les colonnes.
            */}
            <table className="w-full min-w-[300px] text-left text-sm sm:min-w-[500px] md:min-w-[600px] lg:min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-muted/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                    Prospect
                  </DataTableHead>
                  {/*
                    Les colonnes s'allument aux mêmes largeurs que sur
                    /company/rendez-vous : c'est le même rendez-vous vu deux
                    fois, et il serait déroutant qu'une colonne apparaisse ici
                    et pas là sur le même écran.
                  */}
                  <DataTableHead className="hidden px-4 py-3.5 text-right md:table-cell dark:text-zinc-400">
                    Potentiel
                  </DataTableHead>
                  {/*
                    Sur téléphone l'intitulé se raccourcit : « Date du RDV »
                    réclame plus de largeur que les dates elles-mêmes, et une
                    colonne dictée par son en-tête vole cette place au nom du
                    prospect, qui est la seule donnée qu'on lise ligne à ligne.
                  */}
                  <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                    <span className="sm:hidden">Date</span>
                    <span className="hidden sm:inline">Date du RDV</span>
                  </DataTableHead>
                  {/*
                    « État » dit ce qu'il reste à faire sur le rendez-vous, pas
                    où il en est dans le pipeline : c'est la colonne qui rend la
                    liste actionnable. Sur téléphone elle descend sous le nom du
                    prospect, avec l'étape, faute de largeur pour une colonne.
                  */}
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
                {home.recentMeetings.length === 0 ? (
                  /*
                    Cette ligne disait « Changez la période avec le sélecteur en
                    haut de page ». La consigne ne pouvait jamais être suivie,
                    et la démonstration tient en trois pas : les lignes et les
                    compteurs de fenêtres sortent de la même requête, au même
                    cadrage ; une fenêtre servie sans aucun rendez-vous est donc
                    sous le seuil, donc fermée ; et une fenêtre fermée n'est
                    servie que lorsque toutes le sont, faute de quoi la page
                    aurait redirigé vers la première ouverte. Le tableau vide
                    arrive donc toujours avec un sélecteur figé, qui affiche
                    alors ce qu'il faut pour le dégeler. Reste le seul geste qui
                    marche depuis cet écran, celui du bouton juste au-dessus.
                  */
                  <TableEmptyRow
                    colSpan={7}
                    message="Aucun rendez-vous sur la période affichée."
                    description="Préparez un rendez-vous avec le bouton ci-dessus : il apparaîtra ici."
                    size="large"
                  />
                ) : (
                  home.recentMeetings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-muted/80 dark:hover:bg-zinc-800/50"
                    >
                      {/*
                        `max-w-0` avec `w-full` donne à cette colonne toute la
                        place que les autres n'ont pas réclamée, au lieu de la
                        laisser s'étendre à la longueur du plus long nom. Les
                        minimums empêchent qu'elle se réduise à une lettre par
                        ligne quand un nom très long croise un écran étroit.
                      */}
                      <td className="w-full max-w-0 min-w-[7.5rem] px-4 py-3.5 align-middle sm:min-w-[10.5rem]">
                        <ProspectIdentityCell
                          displayName={m.prospectName}
                          company={m.prospectCompany}
                        />
                        {/*
                          Ce que les colonnes n'affichent pas encore descend
                          sous le nom du prospect, dans la seule cellule qui
                          reste. L'état vient d'abord, c'est le geste ; l'étape
                          suit, c'est le contexte. L'information ne coûte alors
                          que de la hauteur, là où une colonne coûtait de la
                          largeur.

                          Les deux pastilles ne remontent pas au même palier, et
                          elles se cachent donc séparément : d'un seul
                          « sm:hidden » l'étape s'effaçait d'ici en même temps
                          que l'état, alors que sa colonne ne s'allume qu'à
                          « md », et un écran de tablette perdait l'étape des
                          deux côtés à la fois.
                        */}
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
      </section>
    </div>
  );
}
