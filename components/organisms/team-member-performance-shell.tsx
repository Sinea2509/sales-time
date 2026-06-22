import { Badge } from "@/components/ui/badge";
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
import { TeamMemberPerformanceProfileCard } from "@/components/organisms/team-member-performance-profile-card";
import type { OrgAdminKissTeamRollup } from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import {
  cardProseBodyClass,
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

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
  posture: string | null;
  nbRdvs: number;
  decouverte: number;
  proposition: number;
  /** TAM — temps d'appel moyen (min) sur les RDV connectés de la fenêtre. */
  tamMinutesAvg: number | null;
  performanceForces: string | null;
  performanceAxes: string | null;
  performanceStop: string | null;
  discBarItems: { key: string; label: string; pct: number; barClass: string }[];
  soncasBarItems: { key: string; label: string; pct: number; barClass: string }[];
  discAffinityText: string | null;
  soncasAffinityText: string | null;
  kissSellerStrengthsNarrative: string | null;
  kissSellerRollup: OrgAdminKissTeamRollup;
  qualificationPotentialPoints: QualificationPotentialMatrixPoint[];
  priorityOpportunities: AnalysePriorityOpportunityRow[];
  salesProfile: SalesProfileScores | null;
  previousSalesProfile: SalesProfileScores | null;
  salesProfileRdvCount: number;
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
  posture,
  nbRdvs,
  decouverte,
  proposition,
  tamMinutesAvg,
  performanceForces,
  performanceAxes,
  performanceStop,
  discBarItems,
  soncasBarItems,
  discAffinityText,
  soncasAffinityText,
  kissSellerStrengthsNarrative,
  kissSellerRollup,
  qualificationPotentialPoints,
  priorityOpportunities,
  salesProfile,
  previousSalesProfile,
  salesProfileRdvCount,
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
          <div className="flex max-w-md flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className={pageTitleClass}>{nameLine}</p>
            {posture ? (
              <Badge
                variant="secondary"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-medium"
              >
                Posture · {posture}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
              >
                Posture · —
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-center gap-8 self-start border-t border-zinc-200 pt-6 sm:justify-end sm:border-t-0 sm:pt-0 lg:min-w-0 dark:border-zinc-800">
          {statColumn({
            value: String(nbRdvs),
            label: "RDVs",
          })}
          {statColumn({
            value: String(decouverte),
            label: "RDVs Découverte",
          })}
          {statColumn({
            value: String(proposition),
            label: "RDVs Proposition",
          })}
          {statColumn({
            value:
              tamMinutesAvg != null
                ? formatDurationHoursMinutes(tamMinutesAvg)
                : "—",
            label: "TAM",
            title:
              "Temps d'appel moyen sur les RDV connectés de ce commercial (durée renseignée)",
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
            <ProfileAffinityHorizontalBars items={discBarItems} />
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
            <ProfileAffinityHorizontalBars items={soncasBarItems} />
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
            rdvCount={salesProfileRdvCount}
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
