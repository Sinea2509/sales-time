import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardAdminShell } from "@/components/organisms/dashboard-admin-shell";
import { DashboardHomeShell } from "@/components/organisms/dashboard-home-shell";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getEnv } from "@/lib/env";
import { cardTitleClass } from "@/lib/page-typography";
import { parseStatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { resolveManagerTeamUserIds } from "@/lib/team-seller-scope";
import { getOrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { listPersonOutreachPriorities } from "@/src/core/application/get-person-outreach-priorities";

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
  const statsWindowDays = parseStatsWindowDays(sp.jours);
  const monEquipePage = parseEquipePage(sp.equipePage);
  const deps = getApplicationDeps();

  if (!actor.activeOrganizationId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation pour afficher les indicateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (actor.workspaceRoleMode === "admin") {
    const teamUserIds = await resolveManagerTeamUserIds(deps, {
      canManageOrganization: actor.canManageOrganization,
      internalUserId: actor.internalUserId,
    });
    const [admin, globalKissJson] = await Promise.all([
      getOrgAdminDashboard(deps, {
        organizationId: actor.activeOrganizationId,
        statsWindowDays,
        monEquipePage,
        teamUserIds,
      }),
      deps.globalKissCoachingPrompts.getPrompts(),
    ]);
    let kissTeamStrengthsNarrative: string | null = null;
    if (admin && getEnv().AI_GATEWAY_API_KEY) {
      try {
        kissTeamStrengthsNarrative = await deps.analysis.summarizeOrgKissRollup(
          {
            rollup: admin.kissTeamRollup,
            model: ANALYSIS_GATEWAY_MODEL,
            organizationKissPromptAppendix: kissMarkdownAppendixForAudience(
              globalKissJson,
              "manager",
            ),
          },
        );
      } catch {
        kissTeamStrengthsNarrative = null;
      }
    }
    return (
      <div className="space-y-6">
        {!admin ? null : (
          <DashboardAdminShell
            admin={admin}
            kissTeamStrengthsNarrative={kissTeamStrengthsNarrative}
          />
        )}
      </div>
    );
  }

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Compte</CardTitle>
            <CardDescription>
              Votre profil utilisateur n’est pas encore synchronisé. Rechargez
              la page ou contactez un administrateur.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const sellerId = actor.internalUserId!;
  const [home, personOutreach] = await Promise.all([
    getOrgDashboardHome(deps, {
      organizationId: actor.activeOrganizationId,
      statsWindowDays,
      sellerUserId: sellerId,
    }),
    listPersonOutreachPriorities(deps, {
      organizationId: actor.activeOrganizationId,
      sellerUserId: sellerId,
      limit: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      {!home ? null : (
        <DashboardHomeShell home={home} personOutreach={personOutreach} />
      )}
    </div>
  );
}
