import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import type { SalesProfileScores } from "@/components/organisms/sales-profile-radar";
import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import { SkillSignatureBadges } from "@/components/molecules/seller-skill-signature-view";
import { TeamMemberStanding } from "@/components/molecules/team-member-standing";
import { TeamMemberPerformanceProfileCard } from "@/components/organisms/team-member-performance-profile-card";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type {
  OrgAdminKissTeamRollup,
  TeamMemberStanding as TeamMemberStandingData,
} from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";
import type { SellerSkillSignature } from "@/src/core/domain/seller-skill-signature";
import {
  MIN_RDV_FOR_STATS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  cardProseBodyClass,
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

/**
 * Phrase d'attente d'un profil, avec les deux chiffres qui la justifient.
 *
 * « Pas assez de données » ne dit ni combien il en manque, ni quand cela
 * changera : le lecteur ne sait pas s'il doit attendre un rendez-vous ou dix,
 * et finit par croire que la fonctionnalité est cassée.
 */
function profilEnAttente(analyses: number, minimum: number): string {
  const compte =
    analyses === 0
      ? "Aucun rendez-vous analysé"
      : analyses === 1
        ? "1 rendez-vous analysé"
        : `${analyses} rendez-vous analysés`;
  return `${compte} sur la période : le profil s'affiche à partir de ${minimum}.`;
}

function statColumn({
  value,
  label,
  title,
}: {
  value: string;
  label: string;
  title?: string;
}) {
  return (
    <div
      className="flex min-w-[4.5rem] flex-col items-start gap-1 sm:min-w-[5.5rem]"
      title={title}
    >
      <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-muted-foreground max-w-[7rem] text-left text-[11px] font-medium leading-tight">
        {label}
      </span>
    </div>
  );
}
export type TeamMemberPerformanceShellProps = {
  sellerUserId: string;
  statsWindowDays: StatsWindowDays;
  performanceFingerprint: string;
  nameLine: string;
  initials: string;
  /**
   * Ce qui distingue ce commercial du reste de son équipe : sa compétence la
   * plus au-dessus de la moyenne, et la plus au-dessous.
   *
   * La fiche affichait auparavant une « Posture », qui valait le levier SONCAS
   * dominant chez ses prospects : une description de son portefeuille, portée
   * sous son nom à lui. Ces deux compétences-ci se notent sur le commercial,
   * pendant l'analyse de chacun de ses rendez-vous coachés, et disent en deux
   * mots ce que le radar plus bas dessine en six.
   *
   * `null` quand il n'y a rien à comparer, soit faute de rendez-vous coaché,
   * soit faute de collègue coaché sur la période.
   */
  skillSignature: SellerSkillSignature | null;
  /** Les rendez-vous coachés qui étayent ces deux compétences. */
  skillMeetings: number;
  /**
   * Place du commercial dans son équipe, telle que le tableau « Mon équipe »
   * vient de l'annoncer. `null` quand la page ne peut pas la calculer.
   */
  standing: TeamMemberStandingData | null;
  nbRdvs: number;
  decouverte: number;
  proposition: number;
  /** TAM : temps d'appel moyen (min) sur les RDV connectés de la fenêtre. */
  tamMinutesAvg: number | null;
  performanceForces: string | null;
  performanceAxes: string | null;
  performanceStop: string | null;
  discBarItems: { key: string; label: string; pct: number; barClass: string }[];
  soncasBarItems: {
    key: string;
    label: string;
    pct: number;
    barClass: string;
  }[];
  discAnalyzedMeetings: number;
  soncasAnalyzedMeetings: number;
  discAffinityText: string | null;
  soncasAffinityText: string | null;
  kissSellerStrengthsNarrative: string | null;
  kissSellerRollup: OrgAdminKissTeamRollup;
  qualificationPotentialPoints: QualificationPotentialMatrixPoint[];
  /** Le vocabulaire d'étapes de l'organisation, qui range les filtres de la matrice. */
  etapeOrder?: readonly string[];
  priorityOpportunities: AnalysePriorityOpportunityRow[];
  salesProfile: SalesProfileScores | null;
  previousSalesProfile: SalesProfileScores | null;
  /**
   * Les rendez-vous qui portent un profil de vente, c'est-à-dire ceux dont
   * l'analyse a pu noter le commercial. Sert aux recommandations.
   */
  salesProfileRdvCount: number;
  /**
   * Tous les rendez-vous du commercial sur la période, analysés ou non.
   *
   * La matrice recevait `salesProfileRdvCount` : elle annonçait donc le nombre
   * de rendez-vous notés là où elle dessine les rendez-vous qualifiés, deux
   * ensembles qui ne se recouvrent pas.
   */
  rdvSurLaPeriode: number;
  progressBullets: string[];
  improvementBullets: string[];
  home: OrgDashboardHome;
};

export function TeamMemberPerformanceShell({
  sellerUserId,
  statsWindowDays,
  performanceFingerprint,
  nameLine,
  initials,
  skillSignature,
  skillMeetings,
  standing,
  nbRdvs,
  decouverte,
  proposition,
  tamMinutesAvg,
  performanceForces,
  performanceAxes,
  performanceStop,
  discBarItems,
  soncasBarItems,
  discAnalyzedMeetings,
  soncasAnalyzedMeetings,
  discAffinityText,
  soncasAffinityText,
  kissSellerStrengthsNarrative,
  kissSellerRollup,
  qualificationPotentialPoints,
  etapeOrder,
  priorityOpportunities,
  salesProfile,
  previousSalesProfile,
  salesProfileRdvCount,
  rdvSurLaPeriode,
  progressBullets,
  improvementBullets,
  home,
}: TeamMemberPerformanceShellProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/80">
            {initials}
          </span>
          <div className="flex max-w-md flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            <p className={pageTitleClass}>{nameLine}</p>
            <SkillSignatureBadges
              signature={skillSignature}
              skillMeetings={skillMeetings}
              className="mt-0.5 justify-center sm:justify-start"
            />
            {standing ? (
              <TeamMemberStanding
                standing={standing}
                className="mt-1 items-center sm:items-start"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-center gap-8 self-start border-t border-zinc-200 pt-6 sm:justify-end sm:border-t-0 sm:pt-0 lg:min-w-0 dark:border-zinc-800">
          {statColumn({
            value: String(nbRdvs),
            label: "RDV",
            title:
              "Nombre total de rendez-vous sur la période, toutes étapes confondues. Les deux compteurs suivants en sont des sous-ensembles : leur somme peut être inférieure au total, les autres étapes n'y figurant pas.",
          })}
          {statColumn({
            value: String(decouverte),
            label: "RDV Découverte",
            title:
              "Rendez-vous de la période dont l'étape est « Découverte ». Sous-ensemble du total.",
          })}
          {statColumn({
            value: String(proposition),
            label: "RDV Proposition",
            title:
              "Rendez-vous de la période dont l'étape est « Proposition ». Sous-ensemble du total.",
          })}
          {statColumn({
            value:
              tamMinutesAvg != null
                ? formatDurationHoursMinutes(tamMinutesAvg)
                : VALEUR_NON_CALCULABLE,
            label: "TAM",
            title:
              tamMinutesAvg != null
                ? "Temps d'appel moyen sur les rendez-vous connectés de ce commercial, c'est-à-dire ceux dont la durée est renseignée."
                : "Non calculable : aucun rendez-vous connecté avec une durée renseignée sur la période.",
          })}
        </div>
      </div>

      <TeamMemberPerformanceProfileCard
        key={performanceFingerprint}
        sellerUserId={sellerUserId}
        statsWindowDays={statsWindowDays}
        initialFingerprint={performanceFingerprint}
        initialPerformance={{
          performanceForces,
          performanceAxes,
          performanceStop,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil DISC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {discAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
              <ProfileAffinityHorizontalBars items={discBarItems} />
            ) : (
              <p className="text-muted-foreground text-sm">
                {profilEnAttente(discAnalyzedMeetings, MIN_RDV_FOR_STATS)}
              </p>
            )}
            {discAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {discAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil SONCAS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {soncasAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
              <ProfileAffinityHorizontalBars items={soncasBarItems} />
            ) : (
              <p className="text-muted-foreground text-sm">
                {profilEnAttente(soncasAnalyzedMeetings, MIN_RDV_FOR_STATS)}
              </p>
            )}
            {soncasAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {soncasAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Coaching KISS</h2>
        {kissSellerStrengthsNarrative?.trim() ? (
          <p className={cn(cardProseBodyClass, "max-w-3xl")}>
            {kissSellerStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid
          rollup={kissSellerRollup}
          presentation="managerMemberProfile"
        />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Performance</h2>
          <AnalysePagePeriodFallback value={statsWindowDays} />
        </div>

        <AnalyseKpiCards home={home} isOrgAdmin sellerScoped />

        <div className="space-y-4">
          <h3 className={sectionHeadingClass}>Statistiques globales</h3>
          <AnalyseStatistiquesGlobalesSection
            qualificationPotentialPoints={qualificationPotentialPoints}
            priorityOpportunities={priorityOpportunities}
            rdvSurLaPeriode={rdvSurLaPeriode}
            etapeOrder={etapeOrder}
            statsWindowDays={statsWindowDays}
          />
        </div>

        <div className="space-y-4">
          <h3 className={sectionHeadingClass}>Recommandations</h3>
          <AnalyseRecommandationsSection
            salesProfile={salesProfile}
            previousSalesProfile={previousSalesProfile}
            rdvCount={salesProfileRdvCount}
            progressBullets={progressBullets}
            improvementBullets={improvementBullets}
            isOrgAdmin
            sellerScoped
          />
        </div>
      </section>
    </div>
  );
}
