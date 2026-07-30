import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { getEnv } from "@/lib/env";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { prospectInitials } from "@/lib/prospect-initials";
import { countMeetingTypes } from "@/lib/team-member-performance-helpers";
import { etapeVocabularyFromOptions } from "@/lib/meeting-etape-pill";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";
import { isOutsideScopedTeam, teamScopeGroup } from "@/lib/team-seller-scope";
import type { ApplicationDeps } from "@/lib/application-deps";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import type { TeamMemberPerformanceShellProps } from "@/components/organisms/team-member-performance-shell";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import { getCachedSellerRelationalAffinity } from "@/src/core/application/get-cached-seller-relational-affinity";
import { getCachedOrgKissRollupNarrative } from "@/src/core/application/get-cached-org-kiss-rollup-narrative";
import {
  buildKissTeamRollupFromMeetings,
  getTeamMemberStanding,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { getStatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  countDiscAnalyzedMeetings,
  countSoncasAnalyzedMeetings,
  DISC_BAR_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
} from "@/src/core/domain/seller-affinity-from-meetings";
import {
  disabledStatsWindowDays,
  partitionMeetingsByStatsWindow,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import {
  meetingAtSinceForWindows,
  salesProfileHistory,
  SALES_PROFILE_HISTORY_PERIODS,
} from "@/src/core/domain/sales-profile-history";
import { buildQualificationPotentialMatrixPoints } from "@/src/core/domain/meeting-analyse-matrices";
import { memberNameLine } from "@/src/core/domain/member-name-line";
import { aggregateTeamSalesProfileFromMeetings } from "@/src/core/domain/sales-profile-from-meetings";
import type { SellerRelationalAffinitySummary } from "@/src/core/ports/analysis-port";

/**
 * Tout ce que la fiche de performance d'un commercial affiche, sauf son cadre.
 *
 * Le type se déduit des props du composant plutôt que de se réécrire à côté :
 * ajouter un bloc à l'écran fait alors échouer la compilation de ce chargeur,
 * au lieu de laisser une props manquante se découvrir à l'exécution.
 *
 * `backHref` en est retiré parce qu'il ne se lit nulle part : il dit d'où vient
 * le lecteur, ce que seule la page qui l'accueille sait.
 */
export type TeamMemberPerformanceView = Omit<
  TeamMemberPerformanceShellProps,
  "backHref"
>;

export type TeamMemberPerformanceViewResult =
  | { ok: true; view: TeamMemberPerformanceView }
  | { ok: false; raison: "membre-introuvable" | "tableau-indisponible" };

/**
 * Rassemble la fiche de performance d'un commercial.
 *
 * Le calcul vivait dans la page de la fiche manager. Il en sort pour que le
 * commercial puisse lire de son côté exactement ce que son manager lit de lui :
 * deux assemblages parallèles auraient divergé au premier chiffre ajouté d'un
 * seul côté, et personne n'aurait su lequel des deux écrans avait raison.
 *
 * `teamUserIds` est le périmètre qui donne son sens au rang : le classement se
 * fait dans une équipe, et laquelle dépend de qui regarde. Le manager y met la
 * sienne, le commercial celle de son manager. Absent, il n'y a pas de cadrage,
 * donc le classement porte sur l'organisation, jamais sur personne.
 *
 * `audience` ne change aucun chiffre : les deux lecteurs comptent les mêmes
 * rendez-vous, et c'est tout l'intérêt d'un chargeur unique. Il ne pilote que
 * les trois textes écrits par l'IA, qui parlent à quelqu'un et doivent donc
 * savoir à qui. Il entre aussi dans leurs clés de cache, sans quoi le premier
 * des deux écrans ouvert imposerait sa voix au second.
 */
export async function loadTeamMemberPerformanceView(
  deps: ApplicationDeps,
  input: {
    organizationId: string;
    sellerUserId: string;
    statsWindowDays: StatsWindowDays;
    teamUserIds: string[] | undefined;
    audience: "manager" | "commercial";
  },
): Promise<TeamMemberPerformanceViewResult> {
  const {
    organizationId: orgId,
    sellerUserId,
    statsWindowDays,
    audience,
  } = input;
  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);

  /*
    Le sélecteur de période de cette fiche compte les rendez-vous de ce
    commercial, et de lui seul : tout ce que la page affiche est à lui. Sans
    ces comptes, il annonçait les trois périodes également disponibles, et le
    lecteur qui choisissait « 7 jours » sur quelqu'un qui n'y a rien tombait
    sur des cartes vides sans explication.

    Griser, mais ne pas rediriger : `ensureEligibleStatsWindowDays` réécrirait
    la période, or c'est elle que le lien de retour rend au manager en le
    ramenant à sa liste. Elle écrit de plus `jours` en toutes lettres, que la
    redirection de la page retire aussitôt, la période par défaut de cette
    fiche se disant par son absence.
  */
  const [member, home, globalKissJson, orgSettings, windowCounts] =
    await Promise.all([
      deps.organizationTeam.findMembershipForManagerView(orgId, sellerUserId),
      getOrgDashboardHome(
        {
          meetings: deps.meetings,
          organizationSettings: deps.organizationSettings,
        },
        {
          organizationId: orgId,
          statsWindowDays,
          sellerUserId,
        },
      ),
      deps.globalKissCoachingPrompts.getPrompts(),
      deps.organizationSettings.findByOrganizationId(orgId),
      getStatsWindowRdvsCounts(deps, {
        organizationId: orgId,
        sellerUserIds: [sellerUserId],
      }),
    ]);

  if (!member) return { ok: false, raison: "membre-introuvable" };
  if (!home) return { ok: false, raison: "tableau-indisponible" };

  const disabledStatsDays = disabledStatsWindowDays(windowCounts);

  /*
    La fenêtre de chargement couvre les six périodes de la trajectoire, non plus
    seulement l'actuelle et la précédente. Élargir est sans effet sur le reste :
    `partitionMeetingsByStatsWindow` découpe par dates, si bien que les KPI et la
    croissance lisent les deux mêmes fenêtres qu'avant sur un ensemble plus
    profond. Le plafond de volume et le cadrage sur un commercial ne bougent pas.
  */
  const sinceProfileHistory = meetingAtSinceForWindows(
    statsWindowDays,
    SALES_PROFILE_HISTORY_PERIODS,
  );
  const meetingsForWindow = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: orgId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: sinceProfileHistory,
    sellerUserId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { currentWindow: meetings, previousWindow: previousMeetings } =
    partitionMeetingsByStatsWindow(meetingsForWindow, statsWindowDays);

  /*
    La trajectoire se calcule sur l'ensemble chargé, pas sur la fenêtre courante :
    c'est justement le chemin parcouru avant elle qui l'intéresse.
  */
  const profileHistory = salesProfileHistory(
    meetingsForWindow,
    statsWindowDays,
    SALES_PROFILE_HISTORY_PERIODS,
  );

  const standing = await getTeamMemberStanding(deps, {
    organizationId: orgId,
    statsWindowDays,
    sellerUserId,
    teamUserIds: input.teamUserIds,
  });

  /*
    Le cadrage d'équipe décide d'un rang, pas d'un droit d'accès : la recherche
    globale conduit à la fiche de n'importe quel membre de l'organisation, et
    `findMembershipForManagerView` l'ouvre sans regarder les équipes. La fiche
    doit donc dire ce qu'elle ne peut pas calculer, plutôt que de le retirer en
    silence.
  */
  const horsEquipeDuManager = isOutsideScopedTeam(
    input.teamUserIds,
    sellerUserId,
  );

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
  /*
    L'ordre dans lequel l'organisation a écrit ses étapes, pour ranger la
    rangée de filtres sous la matrice. Il part des réglages de l'organisation
    et non d'une liste figée : une équipe qui a renommé ses étapes les
    retrouve dans son ordre, pas rejetées en fin de rangée.
  */
  const etapeOrder = etapeVocabularyFromOptions(
    orgMeetingFormOptionsFromSettings(orgSettings),
  );
  const teamSalesProfile = aggregateTeamSalesProfileFromMeetings(meetings);
  const previousSalesProfile =
    aggregateTeamSalesProfileFromMeetings(previousMeetings);
  const coachingBullets = await summarizeTeamCoachingRecommendations(deps, {
    meetings,
    previousMeetings,
    teamSalesProfile,
    previousSalesProfile,
    statsWindowDays,
    audience,
    organizationKissPromptAppendix: aiEnabled
      ? kissMarkdownAppendixForAudience(globalKissJson, audience)
      : null,
    home,
    cacheContext: {
      organizationId: orgId,
      sellerUserId,
    },
  });
  const { progressBullets, improvementBullets } = coachingBullets;

  const { decouverte, proposition } = countMeetingTypes(meetings);
  const nameLine = memberNameLine(member.user);

  const meetingDigests = buildMeetingDigestsForAiSummary(meetings);
  const meetingsFingerprint = teamMemberMeetingsFingerprint(meetings);
  const performanceProfile = await getTeamMemberPerformanceProfile(deps, {
    organizationId: orgId,
    sellerUserId,
    sellerDisplayName: nameLine,
    statsWindowDays,
  });
  let relationalAffinity: SellerRelationalAffinitySummary | null = null;
  if (aiEnabled && meetingDigests.length > 0) {
    relationalAffinity = await getCachedSellerRelationalAffinity(deps, {
      organizationId: orgId,
      sellerUserId,
      sellerDisplayName: nameLine,
      statsWindowDays,
      meetings,
    });
  }

  const kissSellerRollup = buildKissTeamRollupFromMeetings(meetings);
  const kissSellerStrengthsNarrative = aiEnabled
    ? await getCachedOrgKissRollupNarrative(deps, {
        organizationId: orgId,
        statsWindowDays,
        meetingsFingerprint,
        rollup: kissSellerRollup,
        sellerUserId,
        audience,
        organizationKissPromptAppendix: kissMarkdownAppendixForAudience(
          globalKissJson,
          audience,
        ),
      })
    : null;

  const discAffinityBars = aggregateDiscAffinityBarsFromMeetings(meetings);
  const soncasAffinityBars = aggregateSoncasAffinityBarsFromMeetings(meetings);
  const discAnalyzedMeetings = countDiscAnalyzedMeetings(meetings);
  const soncasAnalyzedMeetings = countSoncasAnalyzedMeetings(meetings);
  const discBarSource =
    discAffinityBars.length > 0
      ? discAffinityBars
      : emptyDiscAffinityPlaceholder();
  const soncasBarSource =
    soncasAffinityBars.length > 0
      ? soncasAffinityBars
      : emptySoncasAffinityPlaceholder();

  return {
    ok: true,
    view: {
      sellerUserId,
      statsWindowDays,
      disabledStatsDays,
      performanceFingerprint: performanceProfile.fingerprint,
      nameLine,
      initials: prospectInitials(nameLine),
      /*
        Le profil vient de la lecture d'équipe, pas des seuls rendez-vous de
        cette personne : un point fort se dit « au-dessus des autres », et ce
        chargeur ne charge que les siens. En le prenant sur `standing`, la
        fiche et le tableau « Mon équipe » nomment forcément la même
        compétence.
      */
      skillSignature: standing?.row?.skillSignature ?? null,
      skillMeetings: standing?.row?.skillMeetings ?? 0,
      standing,
      /*
        Le mot que la fiche mettra sur ce rang vient du périmètre qui vient de
        le calculer, et non d'un réglage à part : les deux ne peuvent donc pas
        se contredire. Sans cadrage, la fiche disait « la moyenne d'équipe »
        d'un chiffre pris sur l'organisation entière, ce qui arrive au manager
        qui n'a encore personne de rattaché comme au commercial dont le manager
        n'est pas déclaré.
      */
      comparisonGroup: teamScopeGroup(input.teamUserIds),
      horsEquipeDuManager,
      nbRdvs: home.nbRdvs,
      decouverte,
      proposition,
      tamMinutesAvg: home.avgDurationMin,
      performanceForces: performanceProfile.performanceForces,
      performanceAxes: performanceProfile.performanceAxes,
      performanceStop: performanceProfile.performanceStop,
      discBarItems: discBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: DISC_BAR_CLASS[d.key],
      })),
      soncasBarItems: soncasBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: SONCAS_BAR_CLASS[d.key],
      })),
      discAnalyzedMeetings,
      soncasAnalyzedMeetings,
      discAffinityText: relationalAffinity?.discAffinity ?? null,
      soncasAffinityText: relationalAffinity?.soncasAffinity ?? null,
      kissSellerStrengthsNarrative,
      kissSellerRollup,
      qualificationPotentialPoints,
      etapeOrder,
      priorityOpportunities,
      salesProfile: teamSalesProfile.scores,
      previousSalesProfile: previousSalesProfile.scores,
      profileHistory,
      salesProfileRdvCount: teamSalesProfile.rdvCount,
      rdvSurLaPeriode: meetings.length,
      progressBullets,
      improvementBullets,
      home,
    },
  };
}
