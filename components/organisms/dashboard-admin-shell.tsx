import { Suspense } from "react";
import { DashboardStatsPeriodSelect } from "@/components/molecules/dashboard-stats-period-select";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { MonEquipeSection } from "@/components/organisms/mon-equipe-section";
import { OrgAdminActionCards } from "@/components/organisms/org-admin-action-cards";
import { OrgAdminDonutDistributionCard } from "@/components/organisms/org-admin-donut-distribution-card";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { GuideKiss } from "@/components/molecules/reference-commerciale";
import { Skeleton } from "@/components/ui/skeleton";
import { sectionHeadingClass } from "@/lib/page-typography";
import {
  essentielDuManager,
  essentielEstVide,
} from "@/lib/essentiel-du-manager";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import type { OrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";

/**
 * Le tableau de bord du manager, ordonné comme sa lecture : où agir d'abord,
 * l'état de l'équipe ensuite, l'activité et les répartitions à la fin.
 *
 * La page ouvrait sur trois compteurs d'activité sous un intitulé
 * « Indicateurs détaillés » : un manager qui se connectait lisait des volumes
 * avant de savoir où on avait besoin de lui. Les trois cartes de priorités
 * répondent maintenant en premier, et les compteurs descendent sous l'équipe,
 * au rang de contexte.
 *
 * Quand aucune carte n'a rien à dire, l'équipe n'a encore aucune donnée : les
 * compteurs d'activité remontent alors en tête, seuls chiffres qui existent
 * déjà, plutôt que de laisser un titre au-dessus de rien.
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
  const { home, monEquipe, discPie, soncasPie, kissTeamRollup } = admin;
  const jours = admin.statsWindowDays;
  const essentiel = essentielDuManager({
    dispersion: monEquipe.collectif.dispersion,
    rows: monEquipe.rows,
    ranking: monEquipe.ranking,
    statsWindowDays: jours,
    equipePage: monEquipe.page,
  });
  const ouvreSurEssentiel = !essentielEstVide(essentiel);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>
            {ouvreSurEssentiel
              ? "Vos priorités de coaching"
              : "Activité de la période"}
          </h2>
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

        {ouvreSurEssentiel ? (
          <OrgAdminActionCards essentiel={essentiel} />
        ) : (
          <DashboardKpiCards home={home} />
        )}
      </div>

      <MonEquipeSection
        monEquipe={monEquipe}
        statsWindowDays={jours}
        currentUserEmail={currentUserEmail}
        listBasePath="/company"
        comparisonGroup={comparisonGroup}
      />

      {ouvreSurEssentiel ? (
        <section className="space-y-4">
          <h2 className={sectionHeadingClass}>Activité de la période</h2>
          <DashboardKpiCards home={home} />
        </section>
      ) : null}

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
