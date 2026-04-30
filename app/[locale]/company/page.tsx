import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardAdminShell } from "@/components/organisms/dashboard-admin-shell";
import { DashboardHomeShell } from "@/components/organisms/dashboard-home-shell";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { parseStatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import { getApplicationDeps } from "@/lib/application-deps";
import { getOrgAdminDashboard } from "@/src/core/application/get-org-admin-dashboard";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import { listPersonOutreachPriorities } from "@/src/core/application/get-person-outreach-priorities";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ jours?: string }>;
};

export default async function DashboardHomePage({
  searchParams,
}: DashboardPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") {
    redirect("/sign-in");
  }

  const sp = searchParams != null ? await searchParams : {};
  const statsWindowDays = parseStatsWindowDays(sp.jours);
  const deps = getApplicationDeps();

  if (!actor.activeOrganizationId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
            <CardDescription>
              Sélectionnez une organisation pour afficher les indicateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (actor.workspaceRoleMode === "admin") {
    const admin = await getOrgAdminDashboard(deps, {
      organizationId: actor.activeOrganizationId,
      statsWindowDays,
    });
    return (
      <div className="space-y-6">
        {!admin ? null : <DashboardAdminShell admin={admin} />}
      </div>
    );
  }

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compte</CardTitle>
            <CardDescription>
              Votre profil utilisateur n’est pas encore synchronisé. Rechargez la
              page ou contactez un administrateur.
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
