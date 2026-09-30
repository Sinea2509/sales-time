import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MonEquipeSection } from "@/components/organisms/mon-equipe-section";
import { OrgAdminActionCards } from "@/components/organisms/org-admin-action-cards";
import { OrgAdminDonutDistributionCard } from "@/components/organisms/org-admin-donut-distribution-card";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { TeamBlockAxesCard } from "@/components/organisms/team-block-axes-card";
import { TeamPodiumCard } from "@/components/organisms/team-podium-card";
import { TeamSalesScoreBarsCard } from "@/components/organisms/team-sales-score-bars-card";
import { TeamWrittenSynthesisCard } from "@/components/organisms/team-written-synthesis-card";
import { GuideKiss } from "@/components/molecules/reference-commerciale";
import { Skeleton } from "@/components/ui/skeleton";
import { sectionHeadingClass } from "@/lib/page-typography";
import {
  previousWindowLabel,
  statsWindowLabel,
} from "@/lib/stats-window-labels";
import {
  essentielDuManager,
  essentielEstVide,
} from "@/lib/essentiel-du-manager";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import type { OrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

/**
 * Le tableau de bord du manager, comme la maquette du 11 septembre le
 * dessine : quatre tuiles en tête, puis deux colonnes. À gauche, le
 * SalesScore de chaque commercial, les blocs de la grille en retrait et la
 * synthèse écrite de l'équipe avec ses chiffres. À droite, qui accompagner
 * en priorité et le podium de la période.
 *
 * Le tableau nominatif « Mon équipe », les profils rencontrés et le coaching
 * KISS suivent : ce sont les détails que les deux colonnes résument.
 */
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
  const { home, monEquipe, discPie, soncasPie, kissTeamRollup, teamReading } =
    admin;
  const jours = admin.statsWindowDays;
  const essentiel = essentielDuManager({
    dispersion: monEquipe.collectif.dispersion,
    rows: monEquipe.rows,
    ranking: monEquipe.ranking,
    statsWindowDays: jours,
    equipePage: monEquipe.page,
  });
  const aDesPriorites = !essentielEstVide(essentiel);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm leading-relaxed">
            L&apos;activité des {statsWindowLabel(jours)}, comparée aux{" "}
            {previousWindowLabel(jours)}. La période choisie s&apos;applique à
            toutes les pages du manager.
          </p>
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
        <DashboardKpiCards
          home={home}
          audience="team"
          pipeline={teamReading.pipeline}
          scoreSeries={teamReading.scoreSeries}
          sellersCount={teamReading.sellersCount}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,1fr)]">
        <div className="grid gap-4">
          <TeamSalesScoreBarsCard
            bars={teamReading.scoreBars}
            statsWindowDays={jours}
            equipePage={monEquipe.page}
          />
          <TeamBlockAxesCard
            axes={teamReading.blockAxes}
            scorecards={teamReading.scorecards}
          />
          <TeamWrittenSynthesisCard synthesis={teamReading.synthesis} />
        </div>
        <div className="grid content-start gap-4">
          {aDesPriorites ? (
            <section className="space-y-3">
              <h2 className={sectionHeadingClass}>À accompagner en priorité</h2>
              <OrgAdminActionCards essentiel={essentiel} />
            </section>
          ) : null}
          <TeamPodiumCard
            podium={teamReading.podium}
            statsWindowDays={jours}
            equipePage={monEquipe.page}
          />
        </div>
      </div>

      <MonEquipeSection
        monEquipe={monEquipe}
        statsWindowDays={jours}
        currentUserEmail={currentUserEmail}
        listBasePath="/company"
        comparisonGroup={comparisonGroup}
      />

      <section className="space-y-4">
        {/*
          « Statistiques globales » ne disait pas de quoi : ces deux camemberts
          décrivent les prospects rencontrés, pas l'équipe qui les rencontre.
        */}
        <h2 className={sectionHeadingClass}>
          Profils rencontrés en rendez-vous
        </h2>
        <p className="text-muted-foreground -mt-2 max-w-3xl text-sm leading-relaxed">
          Qui votre équipe rencontre : le DISC décrit le style de communication
          des prospects, le SONCAS leur motivation d&apos;achat. Touchez un
          profil, ou « Comprendre », pour savoir comment s&apos;y adapter.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <OrgAdminDonutDistributionCard
            title="Répartition par DISC"
            data={discPie}
            grilleCle="disc"
          />
          <OrgAdminDonutDistributionCard
            title="Répartition par SONCAS"
            data={soncasPie}
            grilleCle="soncas"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className={sectionHeadingClass}>Coaching KISS</h2>
          <GuideKiss className="shrink-0" />
        </div>
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
