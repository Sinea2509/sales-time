import { redirect } from "next/navigation";
import { AnalysePagePeriodFallback } from "@/components/molecules/analyse-page-period-fallback";
import { InfoCard } from "@/components/molecules/info-card";
import {
  PageHeader,
  PageHeaderSimple,
} from "@/components/molecules/page-header";
import { AnalyseKpiCards } from "@/components/organisms/analyse-kpi-cards";
import { AnalyseRecommandationsSection } from "@/components/organisms/analyse-recommandations-section";
import { AnalyseStatistiquesGlobalesSection } from "@/components/organisms/analyse-statistiques-globales-section";
import { TeamMemberPerformanceShell } from "@/components/organisms/team-member-performance-shell";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
import { getEnv } from "@/lib/env";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { sectionHeadingClass } from "@/lib/page-typography";
import { loadTeamMemberPerformanceView } from "@/lib/team-member-performance-view";
import {
  disabledStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { etapeVocabularyFromOptions } from "@/lib/meeting-etape-pill";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";
import { ensureEligibleStatsWindowDays } from "@/lib/resolve-stats-window-days";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import { getStatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";
import {
  resolveManagerTeamUserIds,
  resolveSellerTeamUserIds,
  scopeMeetingsToTeam,
} from "@/lib/team-seller-scope";
import { dashboardHomeFromMeetings } from "@/src/core/domain/dashboard-home-from-meetings";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { prospectingMinutesForStatsWindow } from "@/src/core/domain/dashboard-tam-tuc";
import { buildQualificationPotentialMatrixPoints } from "@/src/core/domain/meeting-analyse-matrices";
import { aggregateTeamSalesProfileFromMeetings } from "@/src/core/domain/sales-profile-from-meetings";

export const dynamic = "force-dynamic";

type AnalysePageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        {/*
          Le titre est celui que cette page portera de toute façon pour ce
          lecteur : annoncer « Performance » ici, puis « Ma performance » une
          fois le compte réparé, laissait croire à deux écrans différents.
        */}
        <PageHeaderSimple title="Ma performance" />
        <InfoCard
          title="Compte"
          description="Profil utilisateur non synchronisé. Impossible de charger votre analyse personnelle."
        />
      </div>
    );
  }

  const sp = searchParams != null ? await searchParams : {};

  const deps = getApplicationDeps();

  /*
    Le commercial lit ici, sur lui-même, la fiche que son manager ouvre sur lui
    depuis « Mon équipe » : même composant, même chargeur, mêmes chiffres. Deux
    assemblages parallèles auraient divergé au premier indicateur ajouté d'un
    seul côté, et les deux se seraient assis en entretien devant deux écrans qui
    ne disent pas la même chose. Seule la voix change, portée par `audience` et
    `perspective` ; aucun nombre n'en dépend.
  */
  if (actor.workspaceRoleMode === "member") {
    const sellerId = actor.internalUserId;
    /*
      Ces comptes refont ceux que le chargeur établit pour griser le sélecteur :
      trois `count` de plus, lancés en parallèle sur exactement les mêmes
      lignes, donc incapables de se contredire. Ils se paient pour garder la
      redirection, que le chargeur ne fait pas : sans elle, un commercial arrivé
      sur « 7 jours » sans rendez-vous y resterait devant des cartes vides,
      alors que le reste de son portail le pose sur une période lisible.
    */
    const windowCounts = await getStatsWindowRdvsCounts(deps, {
      organizationId: actor.activeOrganizationId,
      sellerUserIds: [sellerId],
    });
    const statsWindowDays = ensureEligibleStatsWindowDays({
      searchParams: sp,
      counts: windowCounts,
      redirectPath: "/company/analyse",
    });
    /*
      Le rang se mesure dans l'équipe de son manager, exactement le groupe que
      ce manager voit dans « Mon équipe ». Sans ce cadrage, cet écran et la
      fiche du manager annonceraient deux places différentes pour la même
      personne.
    */
    const teamUserIds = await resolveSellerTeamUserIds(deps, {
      internalUserId: sellerId,
    });
    const chargement = await loadTeamMemberPerformanceView(deps, {
      organizationId: actor.activeOrganizationId,
      sellerUserId: sellerId,
      statsWindowDays,
      teamUserIds,
      audience: "commercial",
    });
    /*
      Un seul refus atteignable, donc une seule issue. « Tableau indisponible »
      ne se produit pas ici : il vient d'un identifiant d'organisation vide, que
      le garde en tête de page a déjà renvoyé. Reste « membre introuvable »,
      c'est-à-dire un lecteur dont l'adhésion a disparu pendant que sa session
      durait. Ce n'est pas une adresse qui ne désigne personne, c'est un compte
      à remettre en ordre, et l'accueil du portail est l'écran qui le dit.
    */
    if (!chargement.ok) {
      redirect("/company");
    }

    return (
      <div className="space-y-6">
        {/*
          Le titre reprend mot pour mot celui de la navigation qui y mène. Il
          reste le titre de niveau un ; c'est le nom du commercial, dans la
          fiche en dessous, qui redescend d'un rang derrière lui.
        */}
        <PageHeaderSimple title="Ma performance" />
        <TeamMemberPerformanceShell
          {...chargement.view}
          perspective="commercial"
        />
      </div>
    );
  }

  /*
    Reste le manager, et lui seul : le commercial est reparti avec sa fiche
    juste au-dessus, et `workspaceRoleMode` ne vaut `null` que sans organisation
    active, cas déjà renvoyé à l'accueil en tête de page. Tout ce qui suit est
    donc l'écran d'équipe, sans voix à choisir ni cadrage individuel à porter.

    L'équipe se résout avant les comptes de période, et non en parallèle du
    chargement des RDV : ces comptes pilotent le sélecteur, qui annonce la
    disponibilité de cet écran et peut même rediriger vers une autre période.
    Ils doivent donc porter sur la population que l'écran affiche, ce qui coûte
    un aller-retour de plus avant les autres.
  */
  const teamUserIds = await resolveManagerTeamUserIds(deps, {
    canManageOrganization: actor.canManageOrganization,
    internalUserId: actor.internalUserId,
  });

  const windowCounts = await getStatsWindowRdvsCounts(deps, {
    organizationId: actor.activeOrganizationId,
    sellerUserIds: teamUserIds,
  });
  const statsWindowDays = ensureEligibleStatsWindowDays({
    searchParams: sp,
    counts: windowCounts,
    redirectPath: "/company/analyse",
  });
  const disabledStatsDays = disabledStatsWindowDays(windowCounts);

  const sincePreviousWindow = previousMeetingAtWindowStart(statsWindowDays);

  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);
  const [meetingsForWindow, globalKissJson, orgSettings] = await Promise.all([
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      // Le plafond est un garde-fou de volume, pas un périmètre : le cadrage
      // est fait par le filtre d'équipe ci-dessous.
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sincePreviousWindow,
      includeLatestSoncasResult: true,
      includeLatestDiscResult: true,
      includeLatestKissResult: true,
    }),
    aiEnabled
      ? deps.globalKissCoachingPrompts.getPrompts()
      : Promise.resolve(null),
    deps.organizationSettings.findByOrganizationId(actor.activeOrganizationId),
  ]);

  /*
    L'ordre dans lequel l'organisation a écrit ses étapes, pour ranger la
    rangée de filtres sous la matrice. Il part des réglages de l'organisation
    et non d'une liste figée : une équipe qui a renommé ses étapes les
    retrouve dans son ordre, pas rejetées en fin de rangée.
  */
  const etapeOrder = etapeVocabularyFromOptions(
    orgMeetingFormOptionsFromSettings(orgSettings),
  );

  /*
    Cette page dit « équipe » huit fois à un manager : profil de vente de
    l'équipe, progrès de l'équipe, axes d'amélioration de l'équipe. Elle
    comptait pourtant l'organisation entière, faute de cadrage. Un manager de
    trois commerciaux lisait donc le profil de vente de ses quarante collègues
    sous le titre « Profil de vente de l'équipe ».

    Le périmètre est le même que celui de `/company` et de `/company/equipe` :
    le manager et les commerciaux qui lui sont rattachés. Une équipe non
    déclarée rend `undefined`, donc « pas de cadrage », donc l'organisation.
  */
  const scopedMeetings = scopeMeetingsToTeam(meetingsForWindow, teamUserIds);

  const { currentWindow: meetings, previousWindow: previousMeetings } =
    partitionMeetingsByStatsWindow(scopedMeetings, statsWindowDays);

  /*
    Les chiffres de tête se comptent sur les rendez-vous que la page a déjà
    chargés, et non sur une requête séparée : « 128 RDV » en carte au-dessus de
    « 19 RDV sur la période » en légende de matrice était deux réponses à la
    même question.
  */
  const home = dashboardHomeFromMeetings({
    statsWindowDays,
    tamMinutesPerRdv: tamMinutesSavedPerMeetingFromSettings(orgSettings),
    prospectingMinutes: prospectingMinutesForStatsWindow(
      orgSettings?.tamObjectiveMinutesPerMonth ?? 180,
      statsWindowDays,
    ),
    current: meetings,
    previous: previousMeetings,
  });

  const priorityOpportunities: AnalysePriorityOpportunityRow[] = [...meetings]
    .filter((m) => m.potentialAmount != null && m.potentialAmount > 0)
    .sort((a, b) => (b.potentialAmount ?? 0) - (a.potentialAmount ?? 0))
    .slice(0, 10)
    .map((m) => ({
      id: m.id,
      prospectName: m.prospectName,
      potentialAmount: m.potentialAmount!,
      salesScore: m.salesScore,
      outcome: m.outcome,
    }));

  const qualificationPotentialPoints =
    buildQualificationPotentialMatrixPoints(meetings);
  const teamSalesProfile = aggregateTeamSalesProfileFromMeetings(meetings);
  const previousSalesProfile =
    aggregateTeamSalesProfileFromMeetings(previousMeetings);
  const coachingBullets = await summarizeTeamCoachingRecommendations(deps, {
    meetings,
    previousMeetings,
    teamSalesProfile,
    previousSalesProfile,
    statsWindowDays,
    audience: "manager",
    organizationKissPromptAppendix: aiEnabled
      ? kissMarkdownAppendixForAudience(globalKissJson, "manager")
      : null,
    home,
    cacheContext: {
      organizationId: actor.activeOrganizationId,
      /*
        La clé de cache doit nommer la population résumée. Deux managers de la
        même organisation partageaient jusqu'ici la clé « org » ; leurs textes
        ne se mélangeaient pas, l'empreinte des RDV les en empêchait, mais
        chacun chassait celui de l'autre à chaque visite. Un manager cadré sur
        son équipe porte donc son propre identifiant.
      */
      sellerUserId: teamUserIds?.length ? actor.internalUserId : null,
    },
  });
  const { progressBullets, improvementBullets } = coachingBullets;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <PageHeader
          title="Performance"
          actions={
            <AnalysePagePeriodFallback
              value={home.statsWindowDays}
              disabledDays={disabledStatsDays}
            />
          }
        />

        <AnalyseKpiCards home={home} isOrgAdmin />
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Statistiques globales</h2>

        <AnalyseStatistiquesGlobalesSection
          qualificationPotentialPoints={qualificationPotentialPoints}
          priorityOpportunities={priorityOpportunities}
          rdvSurLaPeriode={meetings.length}
          isTeamView
          etapeOrder={etapeOrder}
          statsWindowDays={home.statsWindowDays}
          disabledStatsDays={disabledStatsDays}
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Recommandations</h2>
        <AnalyseRecommandationsSection
          salesProfile={teamSalesProfile.scores}
          previousSalesProfile={previousSalesProfile.scores}
          rdvCount={teamSalesProfile.rdvCount}
          progressBullets={progressBullets}
          improvementBullets={improvementBullets}
          isOrgAdmin
        />
      </section>
    </div>
  );
}
