import { notFound, redirect } from "next/navigation";
import { TeamMemberPerformanceShell } from "@/components/organisms/team-member-performance-shell";
import type { AnalysePriorityOpportunityRow } from "@/components/organisms/analyse-priority-opportunities-table";
import { buildMeetingDigestsForAiSummary } from "@/lib/meeting-ai-digest";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getEnv } from "@/lib/env";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { prospectInitials } from "@/lib/prospect-initials";
import { countMeetingTypes } from "@/lib/team-member-performance-helpers";
import { getApplicationDeps } from "@/lib/application-deps";
import { etapeVocabularyFromOptions } from "@/lib/meeting-etape-pill";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";
import {
  isOutsideScopedTeam,
  resolveManagerTeamUserIds,
} from "@/lib/team-seller-scope";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import { getCachedSellerRelationalAffinity } from "@/src/core/application/get-cached-seller-relational-affinity";
import {
  buildKissTeamRollupFromMeetings,
  getTeamMemberStanding,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { getStatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";
import { summarizeTeamCoachingRecommendations } from "@/src/core/application/summarize-team-coaching-recommendations";
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
  DEFAULT_STATS_WINDOW_DAYS,
  disabledStatsWindowDays,
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { pathWithStatsWindow } from "@/lib/resolve-stats-window-days";
import { buildQualificationPotentialMatrixPoints } from "@/src/core/domain/meeting-analyse-matrices";
import { aggregateTeamSalesProfileFromMeetings } from "@/src/core/domain/sales-profile-from-meetings";
import type { SellerRelationalAffinitySummary } from "@/src/core/ports/analysis-port";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import { getCachedOrgKissRollupNarrative } from "@/src/core/application/get-cached-org-kiss-rollup-narrative";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ userId: string }>;
  /**
   * `equipePage` n'est pas lu par cette page : il n'y sert qu'à la retenir, le
   * temps d'un aller-retour, pour que le lien de retour rende au manager la
   * page de liste d'où il vient plutôt que la première.
   */
  searchParams?: Promise<{ jours?: string; equipePage?: string }>;
};

export default async function ManagerCommercialViewPage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const sp = searchParams != null ? await searchParams : {};
  const joursParam = Array.isArray(sp.jours) ? sp.jours[0] : sp.jours;
  if (joursParam === String(DEFAULT_STATS_WINDOW_DAYS)) {
    // La période par défaut se dit par son absence, mais le reste de la requête
    // survit à ce nettoyage : sans cela, écrire la période courante dans
    // l'adresse suffisait à perdre la page de liste.
    redirect(pathWithStatsWindow(`/company/equipe/${userId}`, sp, null));
  }
  const statsWindowDays = parseStatsWindowDays(sp.jours);
  const retourEquipeHref = pathWithStatsWindow(
    "/company/equipe",
    { equipePage: sp.equipePage },
    statsWindowDays,
  );

  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = actor.activeOrganizationId;
  const aiEnabled = Boolean(getEnv().AI_GATEWAY_API_KEY);

  /*
    Le sélecteur de période de cette fiche compte les rendez-vous de ce
    commercial, et de lui seul : tout ce que la page affiche est à lui. Sans
    ces comptes, il annonçait les trois périodes également disponibles, et le
    manager qui choisissait « 7 jours » sur quelqu'un qui n'y a rien tombait
    sur des cartes vides sans explication.

    Griser, mais ne pas rediriger : `ensureEligibleStatsWindowDays` réécrirait
    la période, or c'est elle que `retourEquipeHref` rend au manager en le
    ramenant à sa liste. Elle écrit de plus `jours` en toutes lettres, que la
    redirection du haut de page retire aussitôt, la période par défaut de cette
    fiche se disant par son absence.
  */
  const [member, home, globalKissJson, orgSettings, windowCounts] =
    await Promise.all([
      deps.organizationTeam.findMembershipForManagerView(orgId, userId),
      getOrgDashboardHome(
        {
          meetings: deps.meetings,
          organizationSettings: deps.organizationSettings,
        },
        {
          organizationId: orgId,
          statsWindowDays,
          sellerUserId: userId,
        },
      ),
      deps.globalKissCoachingPrompts.getPrompts(),
      deps.organizationSettings.findByOrganizationId(orgId),
      getStatsWindowRdvsCounts(deps, {
        organizationId: orgId,
        sellerUserIds: [userId],
      }),
    ]);

  if (!member) notFound();
  if (!home) redirect("/company");

  const disabledStatsDays = disabledStatsWindowDays(windowCounts);

  const sincePreviousWindow = previousMeetingAtWindowStart(statsWindowDays);
  const meetingsForWindow = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: orgId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: sincePreviousWindow,
    sellerUserId: userId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { currentWindow: meetings, previousWindow: previousMeetings } =
    partitionMeetingsByStatsWindow(meetingsForWindow, statsWindowDays);

  // Le rang est relatif : il se calcule sur l'équipe que ce manager a le droit
  // de voir, exactement comme le tableau « Mon équipe » d'où l'on arrive. Sans
  // ce cadrage, la fiche annoncerait une place calculée sur un autre groupe.
  const teamUserIds = await resolveManagerTeamUserIds(deps, {
    canManageOrganization: actor.canManageOrganization,
    internalUserId: actor.internalUserId,
  });
  const standing = await getTeamMemberStanding(deps, {
    organizationId: orgId,
    statsWindowDays,
    sellerUserId: userId,
    teamUserIds,
  });

  /*
    Le cadrage d'équipe décide d'un rang, pas d'un droit d'accès : la recherche
    globale conduit à la fiche de n'importe quel membre de l'organisation, et
    `findMembershipForManagerView` l'ouvre sans regarder les équipes. La fiche
    doit donc dire ce qu'elle ne peut pas calculer, plutôt que de le retirer en
    silence.
  */
  const horsEquipeDuManager = isOutsideScopedTeam(teamUserIds, userId);

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
    audience: "manager",
    organizationKissPromptAppendix: aiEnabled
      ? kissMarkdownAppendixForAudience(globalKissJson, "manager")
      : null,
    home,
    cacheContext: {
      organizationId: orgId,
      sellerUserId: userId,
    },
  });
  const { progressBullets, improvementBullets } = coachingBullets;

  const { decouverte, proposition } = countMeetingTypes(meetings);
  const nameLine =
    [member.user.firstName?.trim() ?? "", member.user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || member.user.email;

  const meetingDigests = buildMeetingDigestsForAiSummary(meetings);
  const meetingsFingerprint = teamMemberMeetingsFingerprint(meetings);
  const performanceProfile = await getTeamMemberPerformanceProfile(deps, {
    organizationId: orgId,
    sellerUserId: userId,
    sellerDisplayName: nameLine,
    statsWindowDays,
  });
  let relationalAffinity: SellerRelationalAffinitySummary | null = null;
  if (aiEnabled && meetingDigests.length > 0) {
    relationalAffinity = await getCachedSellerRelationalAffinity(deps, {
      organizationId: orgId,
      sellerUserId: userId,
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
        sellerUserId: userId,
        organizationKissPromptAppendix: kissMarkdownAppendixForAudience(
          globalKissJson,
          "manager",
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

  return (
    <TeamMemberPerformanceShell
      sellerUserId={userId}
      backHref={retourEquipeHref}
      statsWindowDays={statsWindowDays}
      disabledStatsDays={disabledStatsDays}
      performanceFingerprint={performanceProfile.fingerprint}
      nameLine={nameLine}
      initials={prospectInitials(nameLine)}
      /*
        Le profil vient de la lecture d'équipe, pas des seuls rendez-vous de
        cette personne : un point fort se dit « au-dessus des autres », et cette
        page ne charge que les siens. En le prenant sur `standing`, la fiche et
        le tableau « Mon équipe » nomment forcément la même compétence.
      */
      skillSignature={standing?.row?.skillSignature ?? null}
      skillMeetings={standing?.row?.skillMeetings ?? 0}
      standing={standing}
      horsEquipeDuManager={horsEquipeDuManager}
      nbRdvs={home.nbRdvs}
      decouverte={decouverte}
      proposition={proposition}
      tamMinutesAvg={home.avgDurationMin}
      performanceForces={performanceProfile.performanceForces}
      performanceAxes={performanceProfile.performanceAxes}
      performanceStop={performanceProfile.performanceStop}
      discBarItems={discBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: DISC_BAR_CLASS[d.key],
      }))}
      soncasBarItems={soncasBarSource.map((d) => ({
        key: d.key,
        label: d.label,
        pct: d.pct,
        barClass: SONCAS_BAR_CLASS[d.key],
      }))}
      discAnalyzedMeetings={discAnalyzedMeetings}
      soncasAnalyzedMeetings={soncasAnalyzedMeetings}
      discAffinityText={relationalAffinity?.discAffinity ?? null}
      soncasAffinityText={relationalAffinity?.soncasAffinity ?? null}
      kissSellerStrengthsNarrative={kissSellerStrengthsNarrative}
      kissSellerRollup={kissSellerRollup}
      qualificationPotentialPoints={qualificationPotentialPoints}
      etapeOrder={etapeOrder}
      priorityOpportunities={priorityOpportunities}
      salesProfile={teamSalesProfile.scores}
      previousSalesProfile={previousSalesProfile.scores}
      salesProfileRdvCount={teamSalesProfile.rdvCount}
      rdvSurLaPeriode={meetings.length}
      progressBullets={progressBullets}
      improvementBullets={improvementBullets}
      home={home}
    />
  );
}
