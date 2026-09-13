import { redirect } from "next/navigation";
import { InfoCard } from "@/components/molecules/info-card";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { DashboardAdminShell } from "@/components/organisms/dashboard-admin-shell";
import { DashboardHomeShell } from "@/components/organisms/dashboard-home-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getEnv } from "@/lib/env";
import { disabledStatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";
import { ensureEligibleStatsWindowDays } from "@/lib/resolve-stats-window-days";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import {
  resolveManagerTeamUserIds,
  resolveSellerManagerNameLine,
  resolveSellerTeamUserIds,
  teamScopeGroup,
} from "@/lib/team-seller-scope";
import {
  getOrgAdminDashboard,
  getTeamMemberStanding,
} from "@/src/core/application/get-org-admin-dashboard";
import { getSellerCoachingActionPlan } from "@/src/core/application/get-seller-coaching-action-plan";
import { getCachedOrgKissRollupNarrative } from "@/src/core/application/get-cached-org-kiss-rollup-narrative";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { getStatsWindowRdvsCounts } from "@/src/core/application/get-stats-window-availability";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ jours?: string; equipePage?: string }>;
};

function parseEquipePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }

  const sp = searchParams != null ? await searchParams : {};
  const monEquipePage = parseEquipePage(sp.equipePage);
  const deps = getApplicationDeps();

  if (!actor.activeOrganizationId) {
    return (
      <div className="space-y-6">
        <InfoCard
          title="Organisation"
          description="Sélectionnez une organisation pour afficher les indicateurs."
        />
      </div>
    );
  }

  if (actor.workspaceRoleMode === "admin") {
    // L'équipe se résout avant les comptes, parce que les comptes doivent
    // porter sur elle : le sélecteur de période annonce la disponibilité de
    // cet écran, et cet écran est cadré sur l'équipe du manager.
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
      redirectPath: "/company",
    });
    const disabledStatsDays = disabledStatsWindowDays(windowCounts);
    /*
      Les réglages de l'organisation rejoignent cette salve pour son playbook :
      le récit d'équipe parlait de la méthode de vente de l'organisation sans
      lire celle qu'elle avait décrite. Une ligne sur une clé primaire, menée en
      parallèle de la requête lourde du tableau de bord.
    */
    const [admin, globalKissJson, orgSettings] = await Promise.all([
      getOrgAdminDashboard(deps, {
        organizationId: actor.activeOrganizationId,
        statsWindowDays,
        monEquipePage,
        teamUserIds,
      }),
      deps.globalKissCoachingPrompts.getPrompts(),
      deps.organizationSettings.findByOrganizationId(
        actor.activeOrganizationId,
      ),
    ]);
    const kissTeamStrengthsNarrative =
      admin && getEnv().AI_GATEWAY_API_KEY
        ? await getCachedOrgKissRollupNarrative(deps, {
            organizationId: actor.activeOrganizationId,
            statsWindowDays,
            meetingsFingerprint: admin.meetingsFingerprint,
            rollup: admin.kissTeamRollup,
            audience: "manager",
            organizationKissPromptAppendix: kissMarkdownAppendixForAudience(
              globalKissJson,
              "manager",
            ),
            organizationPlaybookMarkdown:
              organizationPlaybookMarkdownForAnalysis(orgSettings),
          })
        : null;
    return (
      <div className="space-y-6">
        <PageHeaderSimple title="Tableau de bord" />
        {!admin ? null : (
          <DashboardAdminShell
            admin={admin}
            kissTeamStrengthsNarrative={kissTeamStrengthsNarrative}
            currentUserEmail={actor.email}
            disabledStatsDays={disabledStatsDays}
            comparisonGroup={teamScopeGroup(teamUserIds)}
          />
        )}
      </div>
    );
  }

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        <InfoCard
          title="Compte"
          description="Votre profil utilisateur n’est pas encore synchronisé. Rechargez la page ou contactez un administrateur."
        />
      </div>
    );
  }

  const sellerId = actor.internalUserId!;
  const windowCounts = await getStatsWindowRdvsCounts(deps, {
    organizationId: actor.activeOrganizationId,
    sellerUserIds: [sellerId],
  });
  const statsWindowDays = ensureEligibleStatsWindowDays({
    searchParams: sp,
    counts: windowCounts,
    redirectPath: "/company",
  });
  const disabledStatsDays = disabledStatsWindowDays(windowCounts);
  // Le rang est relatif : il se calcule sur l'équipe du manager de ce
  // commercial, exactement le groupe que ce manager voit dans « Mon équipe ».
  // Sans ce cadrage, le même écran annoncerait une place que la fiche du
  // manager démentirait le lendemain.
  const teamUserIds = await resolveSellerTeamUserIds(deps, {
    internalUserId: sellerId,
  });
  const [home, orgSettings, standing, managerNameLine, coachingActions] =
    await Promise.all([
      getOrgDashboardHome(deps, {
        organizationId: actor.activeOrganizationId,
        statsWindowDays,
        sellerUserId: sellerId,
      }),
      deps.organizationSettings.findByOrganizationId(
        actor.activeOrganizationId,
      ),
      getTeamMemberStanding(deps, {
        organizationId: actor.activeOrganizationId,
        statsWindowDays,
        sellerUserId: sellerId,
        teamUserIds,
      }),
      /*
        Le nom qui désigne ce cadrage. Il relit le rattachement que
        `resolveSellerTeamUserIds` vient de lire, une ligne de plus sur une clé
        primaire, menée en parallèle des trois requêtes lourdes de cette salve :
        les fondre en une seule aurait demandé une troisième fonction dont
        « Ma performance », qui cadre sans nommer le manager, n'aurait rien fait.
      */
      resolveSellerManagerNameLine(deps, {
        organizationId: actor.activeOrganizationId,
        internalUserId: sellerId,
      }),
      /*
        Le plan d'action de la semaine, tiré des puces KISS de ses propres
        rendez-vous. Sa requête est cadrée sur lui et n'appelle aucune IA : les
        puces sont déjà écrites à l'analyse de chaque rendez-vous.
      */
      getSellerCoachingActionPlan(deps, {
        organizationId: actor.activeOrganizationId,
        statsWindowDays,
        sellerUserId: sellerId,
      }),
    ]);
  const { meetingTypeOptions, pipelineStageOptions } =
    orgMeetingFormOptionsFromSettings(orgSettings);

  return (
    <div className="space-y-6">
      {/*
        Toutes les autres pages du portail portent leur titre ; celle-ci, la
        première que voit un commercial, entrait directement sur « Mes KPI
        opérationnels », un h2 sans h1 au-dessus. Le libellé reprend mot pour
        mot celui de la navigation qui y mène.
      */}
      <PageHeaderSimple title="Mon tableau de bord" />
      {!home ? null : (
        <DashboardHomeShell
          home={home}
          standing={standing}
          comparisonGroup={teamScopeGroup(teamUserIds)}
          managerNameLine={managerNameLine}
          coachingActions={coachingActions}
          meetingTypeOptions={meetingTypeOptions}
          pipelineStageOptions={pipelineStageOptions}
          disabledStatsDays={disabledStatsDays}
        />
      )}
    </div>
  );
}
