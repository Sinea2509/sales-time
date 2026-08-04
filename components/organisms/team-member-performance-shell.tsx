import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
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
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type {
  OrgAdminKissTeamRollup,
  TeamMemberStanding as TeamMemberStandingData,
} from "@/src/core/application/get-org-admin-dashboard";
import type { OrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import type { QualificationPotentialMatrixPoint } from "@/src/core/domain/meeting-analyse-matrices";
import type { SalesProfilePeriodPoint } from "@/src/core/domain/sales-profile-history";
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
   *
   * Elle est calculée par la page plutôt que fixée ici : le retour doit rendre
   * au manager la vue qu'il avait, et cette vue tient dans la requête.
   *
   * Absente, le lien de retour ne s'affiche pas. C'est bien la présence d'une
   * destination qui décide, et non le lecteur : le commercial qui lit sa propre
   * fiche n'arrive de nulle part, il est chez lui.
   */
  backHref?: string;
  statsWindowDays: StatsWindowDays;
  /**
   * Périodes trop pauvres pour être choisies, options grisées du sélecteur.
   *
   * Elles portent sur ce commercial seul, comme tout le reste de la fiche.
   * Absentes, le sélecteur annonce les trois périodes également disponibles, y
   * compris celles où cette personne n'a conduit aucun rendez-vous : le manager
   * y arrive alors sur des cartes vides, sans rien qui l'explique.
   */
  disabledStatsDays?: StatsWindowDays[];
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
  /**
   * Le groupe sur lequel cette place a été calculée, tel que `teamScopeGroup`
   * le nomme.
   *
   * Il vaut « équipe » dès qu'un périmètre a cadré le classement, et c'est le
   * cas courant des deux écrans qui montent cette fiche. Il vaut
   * « organisation » quand rien ne l'a cadré : un manager qui n'a encore
   * personne de rattaché, un commercial dont le manager n'est pas déclaré. La
   * fiche écrit alors « la moyenne de l'organisation », faute de quoi elle
   * annoncerait une équipe là où elle a compté quarante personnes.
   */
  comparisonGroup?: TeamScopeGroup;
  /**
   * Ce commercial n'est pas rattaché au manager qui le regarde.
   *
   * La recherche globale liste tous les membres de l'organisation et conduit à
   * cette fiche, que `findMembershipForManagerView` ouvre sans regarder les
   * équipes. Sa place, son palier et son profil, eux, se mesurent par rapport à
   * une équipe : hors de celle du lecteur, ils n'ont aucun terme de
   * comparaison. La fiche l'écrit alors, au lieu de retirer les trois sans un
   * mot.
   */
  horsEquipeDuManager?: boolean;
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
   * La trajectoire du profil sur plusieurs périodes, la plus ancienne d'abord.
   *
   * Optionnel parce que la courbe demande un historique que tous les appelants
   * ne chargent pas : sans lui la fiche garde sa croissance chiffrée, qui dit le
   * dernier pas, et se passe du chemin.
   */
  profileHistory?: SalesProfilePeriodPoint[];
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
  perspective = "manager",
  backHref,
  statsWindowDays,
  disabledStatsDays,
  performanceFingerprint,
  nameLine,
  initials,
  skillSignature,
  skillMeetings,
  standing,
  comparisonGroup = "team",
  horsEquipeDuManager = false,
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
  profileHistory,
  salesProfileRdvCount,
  rdvSurLaPeriode,
  progressBullets,
  improvementBullets,
  home,
}: TeamMemberPerformanceShellProps) {
  const luParSonManager = perspective === "manager";
  return (
    <div className="space-y-8">
      {/*
        Cette fiche n'avait aucun chemin de retour : on y entrait depuis le
        tableau « Mon équipe », et on en ressortait par le bouton du navigateur
        ou par le menu latéral, lequel ramène à la première page de la liste.
        Le lien nomme sa destination plutôt que de dire « Retour », qui ne
        promet rien de vérifiable, et il emporte la période et la page de liste
        pour rendre la vue telle qu'elle était.
      */}
      {backHref ? (
        <NavLinkButton
          href={backHref}
          variant="ghost"
          size="sm"
          // Le retrait annule le remplissage gauche du bouton : la flèche se
          // pose alors sur la même verticale que la pastille d'initiales
          // au-dessous, au lieu d'être décalée de dix pixels vers l'intérieur.
          className="-ml-2.5"
        >
          <ArrowLeft aria-hidden="true" />
          Retour à l&apos;équipe
        </NavLinkButton>
      ) : null}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground shadow-sm ring-1 ring-border/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/80">
            {initials}
          </span>
          <div className="flex max-w-md flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            {/*
              Chez le manager, ce nom est le titre de la page : c'est la seule
              chose que la fiche annonce en haut, et elle le disait dans un
              paragraphe, laissant l'écran sans titre de niveau un. Chez le
              commercial, la page porte déjà le sien, « Ma performance » : son
              propre nom y redescend d'un rang, où il ne fait plus que
              confirmer de qui l'on parle.
            */}
            {luParSonManager ? (
              <h1 className={pageTitleClass}>{nameLine}</h1>
            ) : (
              <p className={sectionHeadingClass}>{nameLine}</p>
            )}
            {/*
              Hors de l'équipe du lecteur, ces deux blocs ne disparaissent plus
              en silence. La place et le palier se mesurent par rapport à une
              équipe, celle-ci n'en fournit pas ; quant à l'insigne de profil,
              il annonçait « n. c. » en expliquant « aucun rendez-vous coaché »,
              ce qui est faux : la colonne de droite en compte peut-être douze.
              Ils ne servent simplement pas de comparaison ici.

              La phrase reprend la mise en forme de « Hors classement. » juste
              à côté, dont elle est le voisin le plus proche : même cause dite
              au lecteur, même façon de la dire.
            */}
            {horsEquipeDuManager ? (
              <p className="text-muted-foreground mt-1 max-w-prose text-xs leading-relaxed">
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
                  className="mt-0.5 justify-center sm:justify-start"
                />
                {standing ? (
                  <TeamMemberStanding
                    standing={standing}
                    comparisonGroup={comparisonGroup}
                    className="mt-1 items-center sm:items-start"
                  />
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-center gap-8 self-start border-t border-border pt-6 sm:justify-end sm:border-t-0 sm:pt-0 lg:min-w-0 dark:border-zinc-800">
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
              tamMinutesAvg == null
                ? "Non calculable : aucun rendez-vous connecté avec une durée renseignée sur la période."
                : luParSonManager
                  ? "Temps d'appel moyen sur les rendez-vous connectés de ce commercial, c'est-à-dire ceux dont la durée est renseignée."
                  : "Temps d'appel moyen sur vos rendez-vous connectés, c'est-à-dire ceux dont la durée est renseignée.",
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
          className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="gap-2 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <CardTitle className={cardTitleClass}>
                Affinité relationnelle par profil DISC
              </CardTitle>
              <GuideDeGrille grille={GRILLE_DISC} className="mt-0.5 shrink-0" />
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Les styles de communication avec lesquels ce commercial obtient
              ses meilleurs rendez-vous. Touchez un profil pour savoir comment
              s&apos;y adapter.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {discAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
              <ProfileAffinityHorizontalBars
                items={discBarItems}
                grilleCle="disc"
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {profilEnAttente(discAnalyzedMeetings, MIN_RDV_FOR_STATS)}
              </p>
            )}
            {discAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-border pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {discAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="gap-2 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <CardTitle className={cardTitleClass}>
                Affinité relationnelle par profil SONCAS
              </CardTitle>
              <GuideDeGrille
                grille={GRILLE_SONCAS}
                className="mt-0.5 shrink-0"
              />
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Les motivations d&apos;achat que ce commercial active le mieux.
              Touchez un levier pour savoir comment l&apos;activer.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {soncasAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
              <ProfileAffinityHorizontalBars
                items={soncasBarItems}
                grilleCle="soncas"
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {profilEnAttente(soncasAnalyzedMeetings, MIN_RDV_FOR_STATS)}
              </p>
            )}
            {soncasAffinityText?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-border pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {soncasAffinityText.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

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
          presentation={luParSonManager ? "managerMemberProfile" : "sellerSelf"}
        />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionHeadingClass}>Performance</h2>
          <AnalysePagePeriodFallback
            value={statsWindowDays}
            disabledDays={disabledStatsDays}
          />
        </div>

        {/*
          Les deux drapeaux ne décrivent pas le lecteur mais ce qu'il regarde :
          « un administrateur » et « un commercial en particulier ». Ils sont
          donc vrais ensemble ou faux ensemble ici, le commercial qui se lit
          lui-même n'étant ni l'un ni l'autre.
        */}
        <AnalyseKpiCards
          home={home}
          isOrgAdmin={luParSonManager}
          sellerScoped={luParSonManager}
        />

        <div className="space-y-4">
          <h3 className={sectionHeadingClass}>Statistiques globales</h3>
          <AnalyseStatistiquesGlobalesSection
            qualificationPotentialPoints={qualificationPotentialPoints}
            priorityOpportunities={priorityOpportunities}
            rdvSurLaPeriode={rdvSurLaPeriode}
            etapeOrder={etapeOrder}
            statsWindowDays={statsWindowDays}
            disabledStatsDays={disabledStatsDays}
          />
        </div>

        <div className="space-y-4">
          <h3 className={sectionHeadingClass}>Recommandations</h3>
          <AnalyseRecommandationsSection
            salesProfile={salesProfile}
            previousSalesProfile={previousSalesProfile}
            profileHistory={profileHistory}
            rdvCount={salesProfileRdvCount}
            progressBullets={progressBullets}
            improvementBullets={improvementBullets}
            isOrgAdmin={luParSonManager}
            sellerScoped={luParSonManager}
            statsWindowDays={statsWindowDays}
          />
        </div>
      </section>
    </div>
  );
}
