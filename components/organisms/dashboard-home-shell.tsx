import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { CommercialActionPlan } from "@/components/organisms/commercial-action-plan";
import { CommercialDashboardHero } from "@/components/organisms/commercial-dashboard-hero";
import { CommercialMonthFocusCards } from "@/components/organisms/commercial-month-focus-cards";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { RecentMeetingsTable } from "@/components/organisms/recent-meetings-table";
import { MeetingCreateDialog } from "@/components/organisms/meeting-create-dialog";
import { meetingsTodoSummary } from "@/src/core/domain/meeting-next-action";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { sectionHeadingClass } from "@/lib/page-typography";
import { sousTitreDuGroupe } from "@/components/organisms/dashboard-standing-card";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import { cn } from "@/lib/utils";
import type { TeamMemberStanding } from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { CoachingAction } from "@/src/core/domain/seller-action-plan";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

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

        <RecentMeetingsTable
          rows={home.recentMeetings}
          emptyMessage="Aucun rendez-vous sur la période affichée."
          emptyDescription="Analysez un rendez-vous avec le bouton ci-dessus : il apparaîtra ici."
        />
      </section>
    </div>
  );
}
