import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { BarRow } from "@/components/molecules/bar-row";
import { GuideKiss } from "@/components/molecules/reference-commerciale";
import { KpiVsPreviousBadge } from "@/components/molecules/trend-pill";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import { DashboardKpiCards } from "@/components/organisms/dashboard-kpi-cards";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { RecentMeetingsTable } from "@/components/organisms/recent-meetings-table";
import { SalesProfileRadar } from "@/components/organisms/sales-profile-radar";
import { SellerAffinityCards } from "@/components/organisms/seller-affinity-cards";
import type { TeamMemberPerformanceShellProps } from "@/components/organisms/team-member-performance-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  cardProseBodyClass,
  cardTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import {
  previousWindowLabel,
  statsWindowLabel,
} from "@/lib/stats-window-labels";
import { cn } from "@/lib/utils";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import { salesProfileReading } from "@/src/core/domain/sales-profile-reading";
import { SELLER_SKILL_LABEL_FR } from "@/src/core/domain/seller-skill-signature";

/**
 * « Ma performance », lue par le commercial lui-même, comme la maquette du 11
 * septembre la dessine : quatre tuiles, le radar de son profil de vente avec
 * la période précédente en pointillé, la progression par compétence et ce
 * qu'elle traduit, puis les rendez-vous derrière ces chiffres.
 *
 * Le bloc de tête de la fiche manager, place dans l'équipe et compteurs par
 * type de rendez-vous, n'est pas là : il s'adresse au manager. La matrice et
 * les opportunités prioritaires ferment la page.
 */
export function SellerPerformanceView({
  statsWindowDays,
  disabledStatsDays,
  home,
  scoreSeries = [],
  windowMeetings = [],
  salesProfile,
  previousSalesProfile,
  salesProfileRdvCount,
  discBarItems,
  soncasBarItems,
  discAnalyzedMeetings,
  soncasAnalyzedMeetings,
  discAffinityText,
  soncasAffinityText,
  kissSellerStrengthsNarrative,
  kissSellerRollup,
  progressBullets,
  improvementBullets,
  profileHistory,
  qualificationPotentialPoints,
  priorityOpportunities,
  rdvSurLaPeriode,
  etapeOrder,
}: TeamMemberPerformanceShellProps) {
  const reading = salesProfile
    ? salesProfileReading(salesProfile, previousSalesProfile, "commercial")
    : null;
  const analyzed = home.noteGlobaleSampleCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Moyenne sur {analyzed}{" "}
          {plurielFr(analyzed, "rendez-vous analysé", "rendez-vous analysés")},{" "}
          {statsWindowLabel(statsWindowDays)}, comparée aux{" "}
          {previousWindowLabel(statsWindowDays)}.
        </p>
        <AnalysePagePeriodFallback
          value={statsWindowDays}
          disabledDays={disabledStatsDays}
        />
      </div>

      <DashboardKpiCards
        home={home}
        audience="seller"
        showSalesScore
        scoreSeries={scoreSeries}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,1fr)]">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <h2 className={cardTitleClass}>Profil de vente</h2>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Six compétences sont notées sur 100 à partir des rendez-vous
                analysés
                {salesProfile
                  ? `, moyenne sur ${salesProfileRdvCount} ${plurielFr(salesProfileRdvCount, "rendez-vous coaché", "rendez-vous coachés")}.`
                  : "."}
              </p>
            </div>
            {salesProfile ? (
              <SalesProfileRadar
                scores={salesProfile}
                previousScores={previousSalesProfile}
              />
            ) : (
              <p className="text-muted-foreground max-w-prose py-10 text-center text-sm">
                Le profil se lit sur le coaching KISS, qui note six compétences
                de vente à chaque rendez-vous. Analysez un rendez-vous pour le
                construire.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div>
                <h2 className={cardTitleClass}>Progression par compétence</h2>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Chaque barre montre la note actuelle, la valeur à droite
                  montre l&apos;évolution sur la période.
                </p>
              </div>
              {reading ? (
                <div>
                  {reading.evolution.map((e) => (
                    <BarRow
                      key={e.key}
                      name={
                        <span className="truncate">
                          {SELLER_SKILL_LABEL_FR[e.key]}
                        </span>
                      }
                      percent={e.current}
                      color={
                        e.deltaPct != null && e.deltaPct < 0
                          ? "var(--chart-ink)"
                          : "var(--brand)"
                      }
                      value={
                        e.deltaPct == null ? (
                          <span className="text-muted-foreground text-xs font-semibold">
                            nouveau
                          </span>
                        ) : (
                          <KpiVsPreviousBadge
                            delta={e.deltaPct}
                            mode="up-good"
                            currentSampleCount={salesProfileRdvCount}
                            minSampleCount={MIN_RDV_FOR_STATS}
                          />
                        )
                      }
                      title={`${SELLER_SKILL_LABEL_FR[e.key]} : ${Math.round(e.current)} sur 100`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  La progression s&apos;affiche avec le premier rendez-vous
                  coaché.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>Ce que cela traduit</h2>
              <p className={cn(cardProseBodyClass, "leading-[1.65]")}>
                {reading
                  ? reading.text
                  : "Vos compétences se lisent sur les rendez-vous coachés : la lecture arrive avec le premier."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className={sectionHeadingClass}>
            Les rendez-vous derrière ces chiffres
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Chacune de ces analyses a contribué à la moyenne affichée en haut de
            page.
          </p>
        </div>
        <RecentMeetingsTable
          rows={windowMeetings}
          emptyMessage="Aucun rendez-vous sur la période affichée."
          emptyDescription="Analysez un rendez-vous depuis la barre du haut : il apparaîtra ici."
        />
      </section>

      <SellerAffinityCards
        discBarItems={discBarItems}
        soncasBarItems={soncasBarItems}
        discAnalyzedMeetings={discAnalyzedMeetings}
        soncasAnalyzedMeetings={soncasAnalyzedMeetings}
        discAffinityText={discAffinityText}
        soncasAffinityText={soncasAffinityText}
        perspective="commercial"
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className={sectionHeadingClass}>Coaching KISS</h2>
          <GuideKiss className="shrink-0" />
        </div>
        {kissSellerStrengthsNarrative?.trim() ? (
          <p className={cn(cardProseBodyClass, "max-w-3xl")}>
            {kissSellerStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid
          rollup={kissSellerRollup}
          presentation="sellerSelf"
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Recommandations</h2>
        <AnalyseRecommandationsSection
          salesProfile={salesProfile}
          previousSalesProfile={previousSalesProfile}
          profileHistory={profileHistory}
          rdvCount={salesProfileRdvCount}
          progressBullets={progressBullets}
          improvementBullets={improvementBullets}
          isOrgAdmin={false}
          statsWindowDays={statsWindowDays}
          showProfile={false}
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>
        <AnalyseStatistiquesGlobalesSection
          qualificationPotentialPoints={qualificationPotentialPoints}
          priorityOpportunities={priorityOpportunities}
          rdvSurLaPeriode={rdvSurLaPeriode}
          etapeOrder={etapeOrder}
          statsWindowDays={statsWindowDays}
          disabledStatsDays={disabledStatsDays}
        />
      </section>
    </div>
  );
}
