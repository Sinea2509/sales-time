import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MonEquipeSection } from "@/components/organisms/mon-equipe-section";
import { OrgAdminDonutDistributionCard } from "@/components/organisms/org-admin-donut-distribution-card";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { sectionHeadingClass } from "@/lib/page-typography";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import type { OrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

export function DashboardAdminShell({
  admin,
  kissTeamStrengthsNarrative,
  currentUserEmail,
  disabledStatsDays = [],
  comparisonGroup,
}: {
  admin: OrgAdminDashboard;
  kissTeamStrengthsNarrative?: string | null;
  currentUserEmail: string;
  disabledStatsDays?: StatsWindowDays[];
  /**
   * Groupe réellement listé, passé tel quel à la section d'équipe.
   *
   * La coque ne s'en sert pas elle-même : elle le transporte, parce que c'est la
   * page qui connaît le cadrage et la section qui écrit la phrase. Optionnel
   * comme il l'est sur la section, pour la même raison.
   */
  comparisonGroup?: TeamScopeGroup;
}) {
  const { home, monEquipe, discPie, soncasPie, kissTeamRollup } = admin;
  const jours = admin.statsWindowDays;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Indicateurs détaillés</h2>
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

        <DashboardKpiCards home={home} />
      </div>

      <MonEquipeSection
        monEquipe={monEquipe}
        statsWindowDays={jours}
        currentUserEmail={currentUserEmail}
        listBasePath="/company"
        comparisonGroup={comparisonGroup}
      />

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <OrgAdminDonutDistributionCard
            title="Répartition par DISC"
            data={discPie}
          />
          <OrgAdminDonutDistributionCard
            title="Répartition par SONCAS"
            data={soncasPie}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Coaching KISS</h2>
        {kissTeamStrengthsNarrative?.trim() ? (
          <p className="text-foreground max-w-3xl text-sm leading-relaxed">
            {kissTeamStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid rollup={kissTeamRollup} />
      </section>
    </div>
  );
}
