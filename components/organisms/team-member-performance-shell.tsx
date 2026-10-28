import { Suspense, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { PerformanceUnlockPanel } from "@/components/molecules/performance-unlock-panel";
import { UnlockProgress } from "@/components/molecules/unlock-progress";
import { statsWindowLabel } from "@/lib/stats-window-labels";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { PanelTabs } from "@/components/organisms/panel-tabs";
import type { SalesProfileScores } from "@/components/organisms/sales-profile-radar";
import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import {
  GuideDeGrille,
  GuideKiss,
} from "@/components/molecules/reference-commerciale";
import { GRILLE_DISC, GRILLE_SONCAS } from "@/lib/grilles-commerciales";
import { SkillSignatureBadges } from "@/components/molecules/seller-skill-signature-view";
import { TeamMemberStanding } from "@/components/molecules/team-member-standing";
import { TeamMemberPerformanceProfileCard } from "@/components/organisms/team-member-performance-profile-card";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import type {
  OrgAdminKissTeamRollup,
  TeamMemberStanding as TeamMemberStandingData,
} from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { firstSentence } from "@/src/core/domain/first-sentence";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";
import type { SalesProfilePeriodPoint } from "@/src/core/domain/sales-profile-history";
import type { SellerSkillSignature } from "@/src/core/domain/seller-skill-signature";
import {
  MIN_RDV_FOR_STATS,
  type StatsWindowDays,
  type StatsWindowRange,
} from "@/src/core/domain/dashboard-stats-window";
import {
  cardProseBodyClass,
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

/**
 * Les textes que l'IA écrit pour cette fiche, attendus chacun à sa place.
 *
 * La fiche s'affiche dès que ses chiffres sont prêts ; ces quatre textes
 * arrivent ensuite, sans la bloquer (demande de Thomas du 23 octobre 2026,
 * qui attendait quinze secondes en cliquant sur un membre). Chacun rend une
 * valeur vide plutôt que d'échouer.
 */
export type TeamMemberAiTexts = {
  performance: Promise<{
    fingerprint: string;
    performanceForces: string | null;
    performanceAxes: string | null;
    performanceStop: string | null;
    hasSummary: boolean;
  } | null>;
  coaching: Promise<{
    progressBullets: string[];
    improvementBullets: string[];
  }>;
  affinity: Promise<{ discAffinity: string; soncasAffinity: string } | null>;
  kissNarrative: Promise<string | null>;
};

export type TeamMemberPerformanceShellProps = {
  sellerUserId: string;
  /**
   * Qui lit cette fiche : son manager, ou le commercial lui-même.
   *
   * Les chiffres ne s'en occupent pas. Un seul chargeur les rassemble pour les
   * deux, et c'est tout l'intérêt : le manager et son commercial ne peuvent pas
   * lire deux totaux différents de la même personne. Ne changent ici que les
   * phrases qui s'adressent à quelqu'un, « de ce commercial » d'un côté,
   * « vos » et « mes » de l'autre, et le rang du nom, qui est le titre de la
   * page chez le manager et une simple identification chez le commercial, dont
   * la page porte déjà le sien.
   */
  perspective?: "manager" | "commercial";
  /**
   * L'adresse de la liste d'équipe, période et page de liste comprises.
   * Absente, le lien de retour ne s'affiche pas : le commercial qui lit sa
   * propre fiche n'arrive de nulle part, il est chez lui.
   */
  backHref?: string;
  statsWindowDays: StatsWindowDays;
  /** Les dates de la période quand elle a été choisie au calendrier. */
  statsWindowRange?: StatsWindowRange | null;
  /** Périodes trop pauvres pour être choisies, pour ce commercial seul. */
  disabledStatsDays?: StatsWindowDays[];
  nameLine: string;
  initials: string;
  /**
   * Sa compétence la plus au-dessus de la moyenne de l'équipe, et la plus
   * au-dessous. `null` faute de rendez-vous coaché ou de collègue à comparer.
   */
  skillSignature: SellerSkillSignature | null;
  /** Les rendez-vous coachés qui étayent ces deux compétences. */
  skillMeetings: number;
  /** Sa place dans l'équipe, comme sur « Mon équipe ». */
  standing: TeamMemberStandingData | null;
  /** Le groupe sur lequel cette place a été calculée. */
  comparisonGroup?: TeamScopeGroup;
  /** Ce commercial n'est pas rattaché au manager qui le regarde. */
  horsEquipeDuManager?: boolean;
  nbRdvs: number;
  /** TAM : temps d'appel moyen (min) sur les RDV connectés de la fenêtre. */
  tamMinutesAvg: number | null;
  discBarItems: { key: string; label: string; pct: number; barClass: string }[];
  soncasBarItems: {
    key: string;
    label: string;
    pct: number;
    barClass: string;
  }[];
  discAnalyzedMeetings: number;
  soncasAnalyzedMeetings: number;
  kissSellerRollup: OrgAdminKissTeamRollup;
  qualificationPotentialPoints: QualificationPotentialMatrixPoint[];
  /** Le vocabulaire d'étapes de l'organisation, qui range les filtres de la matrice. */
  etapeOrder?: readonly string[];
  priorityOpportunities: AnalysePriorityOpportunityRow[];
  salesProfile: SalesProfileScores | null;
  previousSalesProfile: SalesProfileScores | null;
  /** La trajectoire du profil sur plusieurs périodes, la plus ancienne d'abord. */
  profileHistory?: SalesProfilePeriodPoint[];
  /** Les rendez-vous dont l'analyse a pu noter le commercial. */
  salesProfileRdvCount: number;
  /** Tous les rendez-vous du commercial sur la période, analysés ou non. */
  rdvSurLaPeriode: number;
  home: OrgDashboardHome;
  aiTexts: TeamMemberAiTexts;
};

/** La place d'un texte que le coach est en train d'écrire. */
function AiTextPlaceholder({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Le coach rédige">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            "bg-muted h-3.5 animate-pulse rounded",
            i === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

/**
 * « À retenir » : trois phrases en tête de fiche, avant tout détail. La fiche
 * s'ouvrait sur trois paragraphes ; on y lit maintenant d'un coup d'œil le
 * point fort, la priorité et quoi dire au prochain point.
 */
async function KeyTakeaways({
  aiTexts,
  luParSonManager,
}: {
  aiTexts: TeamMemberAiTexts;
  luParSonManager: boolean;
}) {
  const [performance, coaching] = await Promise.all([
    aiTexts.performance,
    aiTexts.coaching,
  ]);
  const fromSummary = performance?.hasSummary ? performance : null;
  const items: { titre: string; texte: string | null; accent: string }[] = [
    {
      titre: luParSonManager ? "Son point fort" : "Votre point fort",
      texte: firstSentence(fromSummary?.performanceForces),
      accent: "border-l-[#33D1B5]",
    },
    {
      titre: "À travailler en priorité",
      texte: firstSentence(fromSummary?.performanceAxes),
      accent: "border-l-[#FFB547]",
    },
    {
      titre: luParSonManager
        ? "À lui dire au prochain point"
        : "Pour votre prochain rendez-vous",
      texte:
        firstSentence(coaching.improvementBullets[0]) ??
        firstSentence(fromSummary?.performanceStop),
      accent: "border-l-brand",
    },
  ];
  const shown = items.filter((i) => i.texte);
  if (shown.length === 0) return null;
  return (
    <section aria-label="À retenir" className="grid gap-3 md:grid-cols-3">
      {shown.map((i) => (
        <div
          key={i.titre}
          className={cn(
            "rounded-xl border border-l-4 border-border bg-card p-4 shadow-sm dark:border-zinc-800",
            i.accent,
          )}
        >
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
            {i.titre}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{i.texte}</p>
        </div>
      ))}
    </section>
  );
}

function KeyTakeawaysPlaceholder() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 dark:border-zinc-800"
        >
          <AiTextPlaceholder lines={2} />
        </div>
      ))}
    </div>
  );
}

async function PerformanceProfile({
  aiTexts,
  sellerUserId,
  statsWindowDays,
  statsWindowRange,
}: {
  aiTexts: TeamMemberAiTexts;
  sellerUserId: string;
  statsWindowDays: StatsWindowDays;
  statsWindowRange: StatsWindowRange | null;
}) {
  const performance = await aiTexts.performance;
  if (!performance) return null;
  return (
    <TeamMemberPerformanceProfileCard
      key={performance.fingerprint}
      sellerUserId={sellerUserId}
      statsWindowDays={statsWindowDays}
      statsWindowRange={statsWindowRange}
      initialFingerprint={performance.fingerprint}
      initialPerformance={{
        performanceForces: performance.performanceForces,
        performanceAxes: performance.performanceAxes,
        performanceStop: performance.performanceStop,
      }}
    />
  );
}

async function Recommandations({
  aiTexts,
  ...props
}: Omit<
  Parameters<typeof AnalyseRecommandationsSection>[0],
  "progressBullets" | "improvementBullets"
> & { aiTexts: TeamMemberAiTexts }) {
  const { progressBullets, improvementBullets } = await aiTexts.coaching;
  return (
    <AnalyseRecommandationsSection
      {...props}
      progressBullets={progressBullets}
      improvementBullets={improvementBullets}
    />
  );
}

async function AffinityText({
  aiTexts,
  grille,
}: {
  aiTexts: TeamMemberAiTexts;
  grille: "disc" | "soncas";
}) {
  const affinity = await aiTexts.affinity;
  const text = (
    grille === "disc" ? affinity?.discAffinity : affinity?.soncasAffinity
  )?.trim();
  if (!text) return null;
  return (
    <p className="text-muted-foreground mt-5 border-t border-border pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
      {text}
    </p>
  );
}

async function KissNarrative({ aiTexts }: { aiTexts: TeamMemberAiTexts }) {
  const text = (await aiTexts.kissNarrative)?.trim();
  if (!text) return null;
  return <p className={cn(cardProseBodyClass, "max-w-3xl")}>{text}</p>;
}

function AffinityCard({
  title,
  intro,
  guide,
  analyzed,
  unlocks,
  bars,
}: {
  title: string;
  intro: string;
  guide: ReactNode;
  analyzed: number;
  unlocks: string;
  bars: ReactNode;
}) {
  return (
    <CardHeader className="gap-2 pb-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <CardTitle className={cardTitleClass}>{title}</CardTitle>
        {guide}
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{intro}</p>
      <div className="pt-3">
        {analyzed >= MIN_RDV_FOR_STATS ? (
          bars
        ) : (
          <UnlockProgress
            current={analyzed}
            target={MIN_RDV_FOR_STATS}
            unlocks={unlocks}
          />
        )}
      </div>
    </CardHeader>
  );
}

export function TeamMemberPerformanceShell({
  sellerUserId,
  perspective = "manager",
  backHref,
  statsWindowDays,
  statsWindowRange = null,
  disabledStatsDays,
  nameLine,
  initials,
  skillSignature,
  skillMeetings,
  standing,
  comparisonGroup = "team",
  horsEquipeDuManager = false,
  nbRdvs,
  discBarItems,
  soncasBarItems,
  discAnalyzedMeetings,
  soncasAnalyzedMeetings,
  kissSellerRollup,
  qualificationPotentialPoints,
  etapeOrder,
  priorityOpportunities,
  salesProfile,
  previousSalesProfile,
  profileHistory,
  salesProfileRdvCount,
  rdvSurLaPeriode,
  home,
  aiTexts,
}: TeamMemberPerformanceShellProps) {
  const luParSonManager = perspective === "manager";
  /*
    Revue UX du 21 octobre 2026 : avant cinq rendez-vous analysés, la fiche
    se remplissait de « 0 », de « n. c. » et de « Pas assez de données ». Un
    panneau dit désormais ce qui se débloque et où en est le commercial ; et
    sans aucun rendez-vous sur la période, il est seul sur la page.
  */
  const analyzed = Math.max(
    discAnalyzedMeetings,
    soncasAnalyzedMeetings,
    salesProfileRdvCount,
  );
  const enConstruction = analyzed < MIN_RDV_FOR_STATS;
  const pageVide = nbRdvs === 0;

  /*
    Refonte du 23 octobre 2026 (« la page d'un membre est nulle et pas
    ergonomique ») : la fiche faisait cinq écrans, ses chiffres clés
    n'arrivaient qu'au quatrième et le choix de la période y figurait deux
    fois. Elle s'ouvre maintenant sur l'essentiel, chiffres et trois phrases à
    retenir, et range le détail dans quatre onglets.
  */
  const tabs = [
    {
      id: "competences" as const,
      label: "Compétences",
      panel: (
        <div className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <AiTextPlaceholder lines={6} />
                </CardContent>
              </Card>
            }
          >
            <Recommandations
              aiTexts={aiTexts}
              salesProfile={salesProfile}
              previousSalesProfile={previousSalesProfile}
              profileHistory={profileHistory}
              rdvCount={salesProfileRdvCount}
              isOrgAdmin={luParSonManager}
              sellerScoped={luParSonManager}
              statsWindowDays={statsWindowDays}
            />
          </Suspense>
          <Suspense
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <AiTextPlaceholder lines={5} />
                </CardContent>
              </Card>
            }
          >
            <PerformanceProfile
              aiTexts={aiTexts}
              sellerUserId={sellerUserId}
              statsWindowDays={statsWindowDays}
              statsWindowRange={statsWindowRange}
            />
          </Suspense>
        </div>
      ),
    },
    {
      id: "coaching" as const,
      label: "Coaching",
      panel: (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-muted-foreground text-sm">
              {luParSonManager
                ? "Ce que le coach lui a dit après ses rendez-vous, réuni par thème."
                : "Ce que le coach vous a dit après vos rendez-vous, réuni par thème."}
            </p>
            <GuideKiss className="shrink-0" />
          </div>
          <Suspense fallback={<AiTextPlaceholder lines={3} />}>
            <KissNarrative aiTexts={aiTexts} />
          </Suspense>
          <OrgAdminKissQuadrantGrid
            rollup={kissSellerRollup}
            presentation={
              luParSonManager ? "managerMemberProfile" : "sellerSelf"
            }
          />
        </section>
      ),
    },
    {
      id: "clients" as const,
      label: luParSonManager ? "Ses clients" : "Vos clients",
      panel: (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            size="sm"
            className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <AffinityCard
              title="Affinité par profil DISC"
              intro={
                luParSonManager
                  ? "Les styles de communication avec lesquels ce commercial obtient ses meilleurs rendez-vous. Touchez un profil pour savoir comment s'y adapter."
                  : "Les styles de communication avec lesquels vous obtenez vos meilleurs rendez-vous. Touchez un profil pour savoir comment s'y adapter."
              }
              guide={
                <GuideDeGrille
                  grille={GRILLE_DISC}
                  className="mt-0.5 shrink-0"
                />
              }
              analyzed={discAnalyzedMeetings}
              unlocks={
                luParSonManager ? "ses affinités DISC" : "vos affinités DISC"
              }
              bars={
                <ProfileAffinityHorizontalBars
                  items={discBarItems}
                  grilleCle="disc"
                />
              }
            />
            <CardContent className="pt-0">
              <Suspense fallback={<AiTextPlaceholder lines={3} />}>
                <AffinityText aiTexts={aiTexts} grille="disc" />
              </Suspense>
            </CardContent>
          </Card>
          <Card
            size="sm"
            className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <AffinityCard
              title="Affinité par profil SONCAS"
              intro={
                luParSonManager
                  ? "Les motivations d'achat que ce commercial active le mieux. Touchez un levier pour savoir comment l'activer."
                  : "Les motivations d'achat que vous activez le mieux. Touchez un levier pour savoir comment l'activer."
              }
              guide={
                <GuideDeGrille
                  grille={GRILLE_SONCAS}
                  className="mt-0.5 shrink-0"
                />
              }
              analyzed={soncasAnalyzedMeetings}
              unlocks={
                luParSonManager
                  ? "ses affinités SONCAS"
                  : "vos affinités SONCAS"
              }
              bars={
                <ProfileAffinityHorizontalBars
                  items={soncasBarItems}
                  grilleCle="soncas"
                />
              }
            />
            <CardContent className="pt-0">
              <Suspense fallback={<AiTextPlaceholder lines={3} />}>
                <AffinityText aiTexts={aiTexts} grille="soncas" />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "rendez-vous" as const,
      label: luParSonManager ? "Ses rendez-vous" : "Vos rendez-vous",
      panel: (
        <AnalyseStatistiquesGlobalesSection
          qualificationPotentialPoints={qualificationPotentialPoints}
          priorityOpportunities={priorityOpportunities}
          rdvSurLaPeriode={rdvSurLaPeriode}
          etapeOrder={etapeOrder}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {backHref ? (
        <NavLinkButton
          href={backHref}
          variant="ghost"
          size="sm"
          // Le retrait aligne la flèche sur la pastille d'initiales au-dessous.
          className="-ml-2.5"
        >
          <ArrowLeft aria-hidden="true" />
          Retour à l&apos;équipe
        </NavLinkButton>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground shadow-sm ring-1 ring-border/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/80">
            {initials}
          </span>
          <div className="flex max-w-xl flex-col gap-1.5">
            {luParSonManager ? (
              <h1 className={pageTitleClass}>{nameLine}</h1>
            ) : (
              <p className={sectionHeadingClass}>{nameLine}</p>
            )}
            {horsEquipeDuManager ? (
              <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
                <span className="font-medium text-foreground dark:text-zinc-300">
                  Hors de votre équipe.
                </span>{" "}
                Sa place, son palier et son profil se lisent par rapport aux
                commerciaux qui vous sont rattachés, dont cette personne ne fait
                pas partie. Le reste de la fiche est bien le sien.
              </p>
            ) : (
              <>
                <SkillSignatureBadges
                  signature={skillSignature}
                  skillMeetings={skillMeetings}
                />
                {standing ? (
                  <TeamMemberStanding
                    standing={standing}
                    comparisonGroup={comparisonGroup}
                    echelle={perspective === "commercial" ? "sur100" : "sur5"}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
        {/* Le seul choix de période de la fiche : tout ce qui suit en dépend. */}
        <AnalysePagePeriodFallback
          value={statsWindowDays}
          range={statsWindowRange}
          disabledDays={disabledStatsDays}
        />
      </div>

      {enConstruction ? (
        <PerformanceUnlockPanel
          analyzed={analyzed}
          deposited={nbRdvs}
          profileThreshold={MIN_RDV_FOR_STATS}
          perspective={luParSonManager ? "manager" : "commercial"}
          newMeetingHref={
            luParSonManager ? undefined : "/company/rendez-vous/nouveau"
          }
          periodLabel={statsWindowLabel(statsWindowDays, statsWindowRange)}
        />
      ) : null}

      {pageVide ? null : (
        <>
          <AnalyseKpiCards
            home={home}
            isOrgAdmin={luParSonManager}
            sellerScoped={luParSonManager}
            echelle={luParSonManager ? "sur5" : "sur100"}
          />

          <div className="space-y-3">
            <h2 className={sectionHeadingClass}>À retenir</h2>
            <Suspense fallback={<KeyTakeawaysPlaceholder />}>
              <KeyTakeaways
                aiTexts={aiTexts}
                luParSonManager={luParSonManager}
              />
            </Suspense>
          </div>

          <PanelTabs
            tabs={tabs}
            label={luParSonManager ? "Fiche du commercial" : "Ma fiche"}
          />
        </>
      )}
    </div>
  );
}
